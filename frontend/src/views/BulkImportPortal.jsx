import React, { useState } from "react";
import { UploadCloud, Box, Users, FileSpreadsheet, FileJson, ArrowRight, ShieldCheck, Info, CheckCircle, AlertTriangle, X } from "lucide-react";
import { api } from "../utils/api";
import "./BulkImportPortal.css";

export default function BulkImportPortal() {
  const [importType, setImportType] = useState("products"); // products vs customers
  const [importFile, setImportFile] = useState(null);
  
  // Checking & committing states
  const [isValidating, setIsValidating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [importReport, setImportReport] = useState(null); // ImportValidationResult

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleValidate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setImportReport(null);

    if (!importFile) {
      setError("Please select a valid CSV or JSON file first.");
      return;
    }

    setIsValidating(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const res = await api.validateImport(importType, formData);
      if (res.success) {
        setImportReport(res.data);
        if (res.data.is_valid) {
          setSuccess(`Validation Clear! All ${res.data.summary.valid_rows} rows are ready to commit.`);
        } else {
          setError(`File checking failed: ${res.data.summary.invalid_rows} row(s) contain validation errors.`);
        }
      } else {
        setError(res.message || "Failed to parse and validate import file.");
      }
    } catch (err) {
      setError("Validation failed: " + err.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCommit = async () => {
    setError("");
    setSuccess("");
    if (!importFile || !importReport) return;

    setIsCommitting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const res = await api.commitImport(importType, formData);
      if (res.success) {
        setSuccess(res.message || "Bulk records written successfully.");
        setImportReport(null);
        setImportFile(null);
        // reset file input
        const fileInput = document.getElementById("import-file-input");
        if (fileInput) fileInput.value = "";
      } else {
        setError(res.message || "Failing to commit records to database.");
      }
    } catch (err) {
      setError("Commit operation failed: " + err.message);
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="tab-pane import-pane animate-fade-in">
      {/* View Header */}
      <div className="view-header">
        <div className="header-meta">
          <span className="header-breadcrumbs">Workspace / Ingestion Portal</span>
          <h1 className="header-title">Bulk File Import Portal</h1>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert-message error-alert animate-fade-in">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {success && (
        <div className="alert-message success-alert animate-fade-in">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button className="alert-close" onClick={() => setSuccess("")}><X size={14} /></button>
        </div>
      )}

      <div className="import-grid-layout">
        {/* File Ingestion Settings */}
        <div className="import-setup-panel glass-card-panel">
          <h3 className="panel-title flex-align-logo">
            <UploadCloud size={20} className="header-logo-icon" /> Ingestion Target
          </h3>

          <form onSubmit={handleValidate} className="import-config-form">
            <div className="input-group">
              <label className="input-label">Data Schema Type</label>
              <div className="import-toggle-selector">
                <button
                  type="button"
                  className={`toggle-select-option ${importType === "products" ? "active" : ""}`}
                  onClick={() => {
                    setImportType("products");
                    setImportReport(null);
                  }}
                >
                  <Box size={16} /> Products Ingestion
                </button>
                <button
                  type="button"
                  className={`toggle-select-option ${importType === "customers" ? "active" : ""}`}
                  onClick={() => {
                    setImportType("customers");
                    setImportReport(null);
                  }}
                >
                  <Users size={16} /> Customers Ingestion
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Select Source File (CSV or JSON)</label>
              <div className="import-drag-zone">
                <div className="drag-icon-container">
                  {importFile ? (
                    importFile.name.endsWith(".json") ? (
                      <FileJson className="drag-upload-icon active-json" size={36} />
                    ) : (
                      <FileSpreadsheet className="drag-upload-icon active-csv" size={36} />
                    )
                  ) : (
                    <UploadCloud className="drag-upload-icon" size={36} />
                  )}
                </div>
                <div className="drag-meta">
                  <span className="drag-main-lbl">
                    {importFile ? importFile.name : "Browse for file"}
                  </span>
                  <span className="drag-sub-lbl">
                    {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : "Supports standard CSV or JSON format arrays"}
                  </span>
                </div>
                <input
                  type="file"
                  id="import-file-input"
                  className="file-hidden-input"
                  accept=".csv,.json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImportFile(e.target.files[0]);
                      setImportReport(null);
                    }
                  }}
                  disabled={isValidating || isCommitting}
                />
              </div>
            </div>

            <button
              type="submit"
              className="primary-btn submit-btn"
              disabled={isValidating || isCommitting || !importFile}
            >
              {isValidating ? (
                <div className="spinner"></div>
              ) : (
                <>
                  Verify & Dry-Run Parse <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Validation MiddleWare Status Status Panel */}
        <div className="import-report-panel glass-card-panel">
          <h3 className="panel-title flex-align-logo">
            <ShieldCheck size={20} className="header-logo-icon" /> Middleware Validation Status
          </h3>

          {!importReport ? (
            <div className="empty-panel-txt centered-import-helper">
              <Info size={40} className="info-import-logo" />
              <span>Verify and run checking schema rules on data files to identify uniqueness conflicts. No database records are touched during checking.</span>
            </div>
          ) : (
            <div className="report-content-wrapper">
              {/* Status status metrics */}
              <div className="report-summary-boxes">
                <div className="sum-box">
                  <span className="sum-val">{importReport.summary.total_rows}</span>
                  <span className="sum-lbl">Total Parsed</span>
                </div>
                <div className="sum-box bg-green-border">
                  <span className="sum-val green-text">{importReport.summary.valid_rows}</span>
                  <span className="sum-lbl">Valid Rows</span>
                </div>
                <div className="sum-box bg-red-border">
                  <span className="sum-val red-text">{importReport.summary.invalid_rows}</span>
                  <span className="sum-lbl">Invalid Rows</span>
                </div>
                <div className="sum-box bg-orange-border">
                  <span className="sum-val orange-text">{importReport.summary.duplicates_in_file}</span>
                  <span className="sum-lbl">File Duplicates</span>
                </div>
              </div>

              {/* Validation Diagnostics summary */}
              {importReport.is_valid ? (
                <div className="report-alert-callout success-callout">
                  <CheckCircle size={20} className="callout-icon" />
                  <div className="callout-meta">
                    <span className="callout-title">Validation Clear!</span>
                    <span className="callout-desc">The middleware reports 0 conflicts. The database has been verified and this file is safe to commit.</span>
                  </div>
                </div>
              ) : (
                <div className="report-alert-callout error-callout">
                  <AlertTriangle size={20} className="callout-icon" />
                  <div className="callout-meta">
                    <span className="callout-title">Validation Blocked</span>
                    <span className="callout-desc">The middleware caught database or schema conflicts. You must fix the conflicts before committing.</span>
                  </div>
                </div>
              )}

              {/* Rows Details diagnostic table */}
              {importReport.errors.length > 0 && (
                <div className="report-errors-table-container">
                  <span className="table-header-lbl">Granular Error Breakdown:</span>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Row ID</th>
                        <th>Field Name</th>
                        <th>Erroneous Value</th>
                        <th>Error Diagnosis Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importReport.errors.map((err, idx) => (
                        <tr key={idx}>
                          <td className="bold">Row {err.row}</td>
                          <td className="code">{err.field}</td>
                          <td className="red-cell-val">{err.value || "None"}</td>
                          <td className="error-message-cell">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Database write commit button */}
              <button
                type="button"
                className="primary-btn submit-btn commit-import-btn"
                disabled={!importReport.is_valid || isCommitting}
                onClick={handleCommit}
              >
                {isCommitting ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    Commit {importReport.summary.valid_rows} Records to database <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
