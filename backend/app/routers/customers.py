from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, get_current_customer
from app.core.security import generate_token, hash_password, verify_password
from app.models.customer import Customer
from app.schemas.customer import (
    CustomerCreate,
    CustomerLogin,
    CustomerResponse,
    CustomerResponseEnvelope,
    CustomerListResponseEnvelope,
    CustomerAuthEnvelope
)
from app.core.import_validator import ImportValidator
from app.schemas.import_validation import CustomerImportRow, ImportReportResponse, ImportValidationResult

router = APIRouter(
    prefix="/customers",
    tags=["customers"]
)

@router.post("/", response_model=CustomerAuthEnvelope, status_code=status.HTTP_201_CREATED)
def register_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    normalized_email = customer.email.strip().lower()

    existing_customer = db.query(Customer).filter(Customer.email.ilike(normalized_email)).first()
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A customer with this email address already exists."
        )

    db_customer = Customer(
        name=customer.name.strip(),
        email=normalized_email,
        phone=customer.phone.strip() if customer.phone else None,
        hashed_password=hash_password(customer.password)
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)

    token = generate_token({"id": db_customer.id, "email": db_customer.email})

    return {
        "success": True,
        "message": "Customer registered successfully.",
        "data": {
            "token": token,
            "customer": db_customer
        }
    }

@router.post("/login", response_model=CustomerAuthEnvelope)
def login_customer(login_data: CustomerLogin, db: Session = Depends(get_db)):
    normalized_email = login_data.email.strip().lower()

    db_customer = db.query(Customer).filter(Customer.email.ilike(normalized_email)).first()
    if not db_customer or not verify_password(login_data.password, db_customer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = generate_token({"id": db_customer.id, "email": db_customer.email})

    return {
        "success": True,
        "message": "Login successful.",
        "data": {
            "token": token,
            "customer": db_customer
        }
    }

@router.get("/", response_model=CustomerListResponseEnvelope)
def get_customers(
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    customers = db.query(Customer).all()
    return {
        "success": True,
        "message": "Customers retrieved successfully.",
        "data": customers
    }

@router.get("/{id}", response_model=CustomerResponseEnvelope)
def get_customer(
    id: int,
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    db_customer = db.query(Customer).filter(Customer.id == id).first()
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {id} not found."
        )
    return {
        "success": True,
        "message": "Customer retrieved successfully.",
        "data": db_customer
    }

@router.delete("/{id}", response_model=CustomerResponseEnvelope, status_code=status.HTTP_200_OK)
def delete_customer(
    id: int,
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    db_customer = db.query(Customer).filter(Customer.id == id).first()
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {id} not found."
        )
    db.delete(db_customer)
    db.commit()
    return {
        "success": True,
        "message": f"Customer with ID {id} was successfully deleted.",
        "data": None
    }

customer_import_validator = ImportValidator(
    schema=CustomerImportRow,
    model=Customer,
    unique_fields=["email"]
)

@router.post("/import/validate", response_model=ImportReportResponse)
async def validate_customers_import(
    validation_result: ImportValidationResult = Depends(customer_import_validator),
    current_customer: Customer = Depends(get_current_customer)
):
    return {
        "success": True,
        "message": "Customer import file validated successfully.",
        "data": validation_result
    }

@router.post("/import", response_model=ImportReportResponse)
async def import_customers(
    validation_result: ImportValidationResult = Depends(customer_import_validator),
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    if not validation_result.is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Bulk import failed due to validation errors. No records were imported.",
                "errors": [err.model_dump() for err in validation_result.errors]
            }
        )

    try:
        new_customers = []
        for record in validation_result.valid_records:
            raw_password = record.get("password") or "Password123"
            hashed_pwd = hash_password(raw_password)

            customer = Customer(
                name=record["name"].strip(),
                email=record["email"].strip().lower(),
                phone=record["phone"].strip() if record.get("phone") else None,
                hashed_password=hashed_pwd
            )
            new_customers.append(customer)
            db.add(customer)

        db.commit()
        return {
            "success": True,
            "message": f"Successfully imported {len(new_customers)} customers.",
            "data": validation_result
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction error during customer import: {str(e)}"
        )
