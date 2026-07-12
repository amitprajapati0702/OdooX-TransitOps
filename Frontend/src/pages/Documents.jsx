import { useState, useEffect } from "react";
import { useOperations } from "../context/OperationsContext.jsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card.jsx";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table.jsx";
import { Select } from "../components/ui/select.jsx";
import { Button } from "../components/ui/button.jsx";
import { getVehicleDocuments, uploadVehicleDocument } from "../services/operationsService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { FileUp, Eye, FileBadge, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export default function Documents() {
  const { vehicles } = useOperations();
  const { authToken } = useAuth();

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [documentType, setDocumentType] = useState("Registration");
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch documents for the selected vehicle
  const loadDocuments = async (vehicleId) => {
    if (!vehicleId) {
      setDocuments([]);
      return;
    }
    setLoadingDocs(true);
    try {
      const docs = await getVehicleDocuments(authToken, vehicleId);
      setDocuments(docs || []);
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast.error("Failed to fetch documents for selected vehicle");
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (selectedVehicleId) {
      loadDocuments(selectedVehicleId);
    } else {
      setDocuments([]);
    }
  }, [selectedVehicleId]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      toast.error("Please select a vehicle to upload documents to.");
      return;
    }
    if (!file) {
      toast.error("Please choose a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("vehicleId", selectedVehicleId);
    formData.append("documentType", documentType);
    formData.append("file", file);

    setUploading(true);
    try {
      await uploadVehicleDocument(authToken, formData);
      toast.success("Document uploaded successfully");
      setFile(null);
      // Reset input element
      const fileInput = document.getElementById("vehicle-file-input");
      if (fileInput) fileInput.value = "";
      
      // Reload documents grid
      await loadDocuments(selectedVehicleId);
    } catch (error) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Upload File Card Column */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="border-gray-900 bg-gray-950/20">
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>Store registration, insurance policies, permits, and inspection files</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <Select
                label="Vehicle Asset"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
              >
                <option value="">Select Asset</option>
                {vehicles.map(v => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.registration_number} ({v.vehicle_name_model})
                  </option>
                ))}
              </Select>

              <Select
                label="Document Classification"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="Registration">Registration Certificate</option>
                <option value="Insurance">Insurance Policy</option>
                <option value="Permit">Road Permit</option>
                <option value="Fitness">Fitness & Pollution Report</option>
                <option value="Other">Other Miscellaneous Docs</option>
              </Select>

              <div className="flex flex-col space-y-1.5 w-full">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Select Compliance File
                </label>
                <div className="border-2 border-dashed border-gray-800 rounded-xl p-6 bg-gray-900/50 hover:bg-gray-900/80 transition-all flex flex-col items-center justify-center space-y-2.5 relative">
                  <FileUp className="h-8 w-8 text-gray-500" />
                  <span className="text-xs text-gray-400 font-semibold">
                    {file ? file.name : "Drag & drop files here, or click to browse"}
                  </span>
                  <input
                    id="vehicle-file-input"
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              </div>

              <Button
                type="submit"
                loading={uploading}
                className="w-full font-bold h-11 text-xs tracking-wider"
              >
                UPLOAD COMPLIANCE FILE
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Documents Column */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="border-gray-900 bg-gray-950/20">
          <CardHeader>
            <CardTitle>Uploaded Credentials Grid</CardTitle>
            <CardDescription>Review scanned certifications and road clearances</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedVehicleId ? (
              <div className="py-16 text-center text-gray-500 font-medium text-sm">
                Please select a vehicle asset from the dropdown in the left panel to fetch credentials.
              </div>
            ) : loadingDocs ? (
              <div className="py-16 text-center text-amber-500 font-semibold text-sm animate-pulse">
                Fetching document registry from server...
              </div>
            ) : documents.length === 0 ? (
              <div className="py-16 text-center text-gray-500 font-medium text-sm">
                No active credentials stored for this vehicle.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Classification</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Date Uploaded</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.document_id}>
                      <TableCell>
                        <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                          <FileBadge className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>{doc.document_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-xs max-w-[200px] truncate">
                        {doc.original_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-gray-500 text-xs font-semibold">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{doc.uploaded_at?.slice(0, 10)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={`http://localhost:5000/uploads/vehicle-documents/${doc.filename || doc.file_path}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex h-8 items-center justify-center px-3.5 rounded-lg border border-gray-800 hover:bg-gray-800 text-xs font-semibold text-amber-500 hover:text-amber-400 transition"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View File
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
