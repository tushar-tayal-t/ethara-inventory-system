import io
import csv
import json
from typing import Type, List, Dict, Any
from fastapi import UploadFile, File, Depends, HTTPException, status
from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session
from sqlalchemy.ext.declarative import DeclarativeMeta

from app.core.dependencies import get_db
from app.schemas.import_validation import (
    ImportErrorDetail,
    ImportSummary,
    ImportValidationResult
)

class ImportValidator:
    def __init__(
        self,
        schema: Type[BaseModel],
        model: Type[Any],
        unique_fields: List[str] = None,
        max_file_size_mb: int = 5
    ):

        self.schema = schema
        self.model = model
        self.unique_fields = unique_fields or []
        self.max_file_size = max_file_size_mb * 1024 * 1024

    async def __call__(
        self,
        file: UploadFile = File(...),
        db: Session = Depends(get_db)
    ) -> ImportValidationResult:

        contents = await file.read()
        if len(contents) > self.max_file_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds the maximum limit of {self.max_file_size // (1024*1024)}MB."
            )

        if len(contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is empty."
            )

        filename = file.filename.lower() if file.filename else ""
        content_type = file.content_type.lower() if file.content_type else ""

        raw_rows: List[Dict[str, Any]] = []

        try:
            if filename.endswith(".json") or "json" in content_type:
                decoded = contents.decode("utf-8-sig")
                parsed_json = json.loads(decoded)
                if isinstance(parsed_json, list):
                    raw_rows = parsed_json
                elif isinstance(parsed_json, dict):
                    raw_rows = [parsed_json]
                else:
                    raise ValueError("JSON must contain an array or a single object.")
            elif filename.endswith(".csv") or "csv" in content_type or "excel" in content_type:
                decoded = contents.decode("utf-8-sig")
                delimiter = ","
                if ";" in decoded.split("\n", 1)[0]:
                    delimiter = ";"

                csv_reader = csv.DictReader(io.StringIO(decoded), delimiter=delimiter)
                raw_rows = list(csv_reader)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unsupported file format. Only CSV (.csv) and JSON (.json) files are allowed."
                )
        except Exception as err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse import file: {str(err)}"
            )

        if not raw_rows:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data rows found in the uploaded file."
            )

        errors: List[ImportErrorDetail] = []
        valid_records: List[Dict[str, Any]] = []

        seen_values: Dict[str, set] = {field: set() for field in self.unique_fields}
        duplicates_in_file_count = 0

        candidate_records: List[Dict[str, Any]] = []
        candidate_row_numbers: List[int] = []

        for index, raw_row in enumerate(raw_rows):
            row_num = index + 2 if filename.endswith(".csv") else index + 1

            clean_row = {}
            for k, v in raw_row.items():
                if k is not None:
                    k_str = k.strip()
                    if isinstance(v, str):
                        v_str = v.strip()
                        clean_row[k_str] = v_str if v_str != "" else None
                    else:
                        clean_row[k_str] = v

            if not any(val is not None for val in clean_row.values()):
                continue

            row_has_errors = False

            try:
                validated_row = self.schema(**clean_row)
                row_data = validated_row.model_dump()
            except ValidationError as val_err:
                row_has_errors = True
                for err in val_err.errors():
                    field_name = str(err["loc"][0])
                    msg = err["msg"]
                    raw_val = clean_row.get(field_name)
                    errors.append(ImportErrorDetail(
                        row=row_num,
                        field=field_name,
                        value=str(raw_val) if raw_val is not None else None,
                        message=msg
                    ))

            if row_has_errors:
                continue

            file_duplicate = False
            for field in self.unique_fields:
                val = row_data.get(field)
                if val is not None:
                    normalized_val = str(val).strip().lower()
                    if normalized_val in seen_values[field]:
                        file_duplicate = True
                        duplicates_in_file_count += 1
                        errors.append(ImportErrorDetail(
                            row=row_num,
                            field=field,
                            value=str(val),
                            message=f"Duplicate value '{val}' detected within the upload file."
                        ))
                    else:
                        seen_values[field].add(normalized_val)

            if file_duplicate:
                continue

            candidate_records.append(row_data)
            candidate_row_numbers.append(row_num)

        if candidate_records and self.unique_fields:
            for field in self.unique_fields:
                values = [rec[field] for rec in candidate_records if rec.get(field) is not None]
                if not values:
                    continue

                existing_db_records = db.query(self.model).filter(
                    getattr(self.model, field).in_(values)
                ).all()

                existing_db_values = {
                    str(getattr(item, field)).strip().lower() for item in existing_db_records
                }

                final_candidates = []
                final_row_numbers = []

                for rec, row_num in zip(candidate_records, candidate_row_numbers):
                    val = rec.get(field)
                    if val is not None:
                        normalized_val = str(val).strip().lower()
                        if normalized_val in existing_db_values:
                            errors.append(ImportErrorDetail(
                                row=row_num,
                                field=field,
                                value=str(val),
                                message=f"A record with this {field.upper()} ('{val}') already exists in the database."
                            ))
                            continue

                    final_candidates.append(rec)
                    final_row_numbers.append(row_num)

                candidate_records = final_candidates
                candidate_row_numbers = final_row_numbers

        valid_records = candidate_records

        total_rows_parsed = len(raw_rows)
        invalid_rows_count = len(set(err.row for err in errors))
        valid_rows_count = len(valid_records)

        summary = ImportSummary(
            total_rows=total_rows_parsed,
            valid_rows=valid_rows_count,
            invalid_rows=invalid_rows_count,
            duplicates_in_file=duplicates_in_file_count
        )

        return ImportValidationResult(
            is_valid=(len(errors) == 0),
            summary=summary,
            errors=sorted(errors, key=lambda e: (e.row, e.field)),
            valid_records=valid_records
        )
