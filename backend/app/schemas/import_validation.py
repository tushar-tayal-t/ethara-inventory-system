from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ProductImportRow(BaseModel):
    """Schema for validating a single product row during import."""
    name: str = Field(..., min_length=1, max_length=100, description="Product Name is required and must be under 100 characters")
    sku: str = Field(..., min_length=1, max_length=50, description="SKU is required and must be under 50 characters")
    description: Optional[str] = Field(None, description="Optional product description")
    price: float = Field(..., gt=0.0, description="Price must be a positive number greater than 0")
    stock: int = Field(default=0, ge=0, description="Stock must be a non-negative integer")

class CustomerImportRow(BaseModel):
    """Schema for validating a single customer row during import."""
    name: str = Field(..., min_length=1, description="Customer Name is required")
    email: str = Field(..., min_length=3, description="Email is required")
    phone: Optional[str] = Field(None, description="Optional phone number")
    password: Optional[str] = Field(None, min_length=6, description="Optional password, minimum 6 characters")

class ImportErrorDetail(BaseModel):
    """Detailed error structure for a single field validation error."""
    row: int = Field(..., description="1-indexed row number where the error occurred")
    field: str = Field(..., description="The name of the field that caused the validation error")
    value: Optional[str] = Field(None, description="The raw value that failed validation")
    message: str = Field(..., description="A user-friendly description of the validation failure")

class ImportSummary(BaseModel):
    """Summary of the import parsing and validation process."""
    total_rows: int = Field(..., description="Total rows parsed in the file")
    valid_rows: int = Field(..., description="Number of valid rows")
    invalid_rows: int = Field(..., description="Number of rows with validation errors")
    duplicates_in_file: int = Field(..., description="Number of duplicate rows within the uploaded file")

class ImportValidationResult(BaseModel):
    """Result returned by the core import validator dependency."""
    is_valid: bool = Field(..., description="Indicates if the entire file is valid without errors")
    summary: ImportSummary = Field(..., description="Overall stats for the import run")
    errors: List[ImportErrorDetail] = Field(default=[], description="List of all validation errors found")
    valid_records: List[Dict[str, Any]] = Field(default=[], description="Cleaned, parsed, and DB-ready data records")

class ImportReportResponse(BaseModel):
    """API envelope response containing the validation report."""
    success: bool
    message: str
    data: ImportValidationResult
