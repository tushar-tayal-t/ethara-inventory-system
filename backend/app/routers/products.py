from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, get_current_customer
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponseEnvelope,
    ProductListResponseEnvelope
)
from app.core.import_validator import ImportValidator
from app.schemas.import_validation import ProductImportRow, ImportReportResponse, ImportValidationResult

router = APIRouter(
    prefix="/products",
    tags=["products"]
)

@router.post("/", response_model=ProductResponseEnvelope, status_code=status.HTTP_201_CREATED)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    normalized_sku = product.sku.strip()

    existing_product = db.query(Product).filter(Product.sku.ilike(normalized_sku)).first()
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A product with this SKU already exists."
        )

    db_product = Product(
        name=product.name.strip(),
        sku=normalized_sku,
        description=product.description.strip() if product.description else None,
        price=product.price,
        stock=product.stock
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return {
        "success": True,
        "message": "Product created successfully.",
        "data": db_product
    }

@router.get("/", response_model=ProductListResponseEnvelope)
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return {
        "success": True,
        "message": "Products retrieved successfully.",
        "data": products
    }

@router.get("/{id}", response_model=ProductResponseEnvelope)
def get_product(id: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found."
        )
    return {
        "success": True,
        "message": "Product retrieved successfully.",
        "data": db_product
    }

@router.put("/{id}", response_model=ProductResponseEnvelope)
def update_product(
    id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    db_product = db.query(Product).filter(Product.id == id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found."
        )

    update_data = product_update.model_dump(exclude_unset=True)

    if "sku" in update_data and update_data["sku"] is not None:
        normalized_sku = update_data["sku"].strip()
        existing_product = db.query(Product).filter(
            Product.sku.ilike(normalized_sku),
            Product.id != id
        ).first()
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A product with this SKU already exists."
            )
        update_data["sku"] = normalized_sku

    if "name" in update_data and update_data["name"] is not None:
        update_data["name"] = update_data["name"].strip()

    if "description" in update_data and update_data["description"] is not None:
        update_data["description"] = update_data["description"].strip()

    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)

    return {
        "success": True,
        "message": "Product updated successfully.",
        "data": db_product
    }

@router.delete("/{id}", response_model=ProductResponseEnvelope)
def delete_product(
    id: int,
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    db_product = db.query(Product).filter(Product.id == id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {id} not found."
        )

    db.delete(db_product)
    db.commit()

    return {
        "success": True,
        "message": f"Product with ID {id} was successfully deleted.",
        "data": None
    }

product_import_validator = ImportValidator(
    schema=ProductImportRow,
    model=Product,
    unique_fields=["sku"]
)

@router.post("/import/validate", response_model=ImportReportResponse)
async def validate_products_import(
    validation_result: ImportValidationResult = Depends(product_import_validator),
    current_customer: Customer = Depends(get_current_customer)
):
    return {
        "success": True,
        "message": "Product import file validated successfully.",
        "data": validation_result
    }

@router.post("/import", response_model=ImportReportResponse)
async def import_products(
    validation_result: ImportValidationResult = Depends(product_import_validator),
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
        new_products = []
        for record in validation_result.valid_records:
            product = Product(
                name=record["name"].strip(),
                sku=record["sku"].strip(),
                description=record["description"].strip() if record.get("description") else None,
                price=record["price"],
                stock=record["stock"]
            )
            new_products.append(product)
            db.add(product)

        db.commit()
        return {
            "success": True,
            "message": f"Successfully imported {len(new_products)} products.",
            "data": validation_result
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction error during product import: {str(e)}"
        )
