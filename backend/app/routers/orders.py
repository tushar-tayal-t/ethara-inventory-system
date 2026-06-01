from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, get_current_customer
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order
from app.models.order_item import OrderItem
from app.schemas.order import (
    OrderCreate,
    OrderUpdate,
    OrderResponseEnvelope,
    OrderListResponseEnvelope
)

router = APIRouter(
    prefix="/orders",
    tags=["orders"]
)

@router.post("/", response_model=OrderResponseEnvelope, status_code=status.HTTP_201_CREATED)
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    customer = db.query(Customer).filter(Customer.id == order_in.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_in.customer_id} not found."
        )

    product_quantities = {}
    for item in order_in.items:
        product_quantities[item.product_id] = product_quantities.get(item.product_id, 0) + item.quantity

    total_amount = 0.0
    order_items_to_create = []

    for prod_id, req_qty in product_quantities.items():
        product = db.query(Product).filter(Product.id == prod_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {prod_id} not found."
            )
        if product.stock < req_qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough stock for product '{product.name}' (ID: {prod_id}). Requested: {req_qty}, Available: {product.stock}."
            )

        product.stock -= req_qty

        total_amount += product.price * req_qty

        order_item = OrderItem(
            product_id=prod_id,
            quantity=req_qty,
            price=product.price
        )
        order_items_to_create.append(order_item)

    db_order = Order(
        customer_id=order_in.customer_id,
        status="pending",
        total_amount=total_amount
    )
    db.add(db_order)
    db.flush()

    for item in order_items_to_create:
        item.order_id = db_order.id
        db.add(item)

    db.commit()
    db.refresh(db_order)

    return {
        "success": True,
        "message": "Order created successfully.",
        "data": db_order
    }

@router.get("/", response_model=OrderListResponseEnvelope)
def get_orders(
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    orders = db.query(Order).all()
    return {
        "success": True,
        "message": "Orders retrieved successfully.",
        "data": orders
    }

@router.get("/{id}", response_model=OrderResponseEnvelope)
def get_order(
    id: int,
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {id} not found."
        )
    return {
        "success": True,
        "message": "Order retrieved successfully.",
        "data": order
    }

@router.put("/{id}/status", response_model=OrderResponseEnvelope)
def update_order_status(
    id: int,
    order_update: OrderUpdate,
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    db_order = db.query(Order).filter(Order.id == id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {id} not found."
        )

    new_status = order_update.status.strip().lower()
    if new_status not in ["pending", "completed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order status. Allowed: pending, completed, cancelled."
        )

    old_status = db_order.status
    if old_status == new_status:
        return {
            "success": True,
            "message": f"Order status is already '{new_status}'.",
            "data": db_order
        }

    if new_status == "cancelled":
        if old_status != "cancelled":
            for item in db_order.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.stock += item.quantity
    elif old_status == "cancelled":
        for item in db_order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item.product_id} no longer exists."
                )
            if product.stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Not enough stock to restore order. Product '{product.name}' has {product.stock} available, need {item.quantity}."
                )
        for item in db_order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            product.stock -= item.quantity

    db_order.status = new_status
    db.commit()
    db.refresh(db_order)

    return {
        "success": True,
        "message": f"Order status updated from '{old_status}' to '{new_status}' successfully.",
        "data": db_order
    }

@router.delete("/{id}", response_model=OrderResponseEnvelope)
def delete_order(
    id: int,
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {id} not found."
        )

    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity

    db.delete(order)
    db.commit()

    return {
        "success": True,
        "message": f"Order with ID {id} was successfully deleted and stock levels restored.",
        "data": None
    }
