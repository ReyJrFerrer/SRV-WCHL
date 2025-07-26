import React from "react";
import { TrashIcon } from "@heroicons/react/24/solid";

interface ServiceImageUploadProps {
  serviceImageFiles: File[];
  imagePreviews: string[];
  handleImageFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: (index: number) => void;
  certificationFiles?: File[];
  certificationPreviews?: string[];
  handleCertificationFilesChange?: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  handleRemoveCertification?: (index: number) => void;
}

const ServiceImageUpload: React.FC<ServiceImageUploadProps> = ({
  serviceImageFiles,
  imagePreviews,
  handleImageFilesChange,
  handleRemoveImage,
  certificationFiles = [],
  certificationPreviews = [],
  handleCertificationFilesChange,
  handleRemoveCertification,
}) => {
  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-8">
      {/* Service Images Section */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-blue-700">
          <span>Service Images</span>
          <span className="text-xs font-normal text-blue-400">(Optional)</span>
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Upload images of your past work. High-quality images help attract more
          clients.
        </p>
        <label
          htmlFor="serviceImages"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Add Service Images
        </label>
        <input
          type="file"
          name="serviceImages"
          id="serviceImages"
          accept="image/png, image/jpeg, image/gif, image/svg+xml"
          multiple
          onChange={handleImageFilesChange}
          className="block w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm file:mr-4 file:rounded-full file:border-0 file:bg-blue-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-200"
        />
        {(serviceImageFiles.length > 0 || imagePreviews.length > 0) && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
            {serviceImageFiles.length > 0
              ? serviceImageFiles.map((file, index) => (
                  <div
                    key={file.name + index}
                    className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm hover:shadow-md"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Service Image ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white opacity-80 shadow-md transition hover:bg-red-700 hover:opacity-100"
                      aria-label={`Remove service image ${index + 1}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))
              : imagePreviews.map((previewUrl, index) => (
                  <div
                    key={previewUrl}
                    className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm hover:shadow-md"
                  >
                    <img
                      src={previewUrl}
                      alt={`Service Image ${index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white opacity-80 shadow-md transition hover:bg-red-700 hover:opacity-100"
                      aria-label={`Remove service image ${index + 1}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
          </div>
        )}
      </div>

      {/* Certifications Section */}
      <div className="rounded-xl border border-green-100 bg-green-50 p-6 shadow-sm">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-green-700">
          <span>Certifications</span>
          <span className="text-xs font-normal text-green-400">(Optional)</span>
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Upload images or PDFs of your certifications or credentials. This
          helps build trust with clients.
        </p>
        <label
          htmlFor="certificationImages"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Add Certifications
        </label>
        <input
          type="file"
          name="certificationImages"
          id="certificationImages"
          accept="image/png, image/jpeg, image/gif, image/svg+xml,application/pdf"
          multiple
          onChange={handleCertificationFilesChange}
          className="block w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm file:mr-4 file:rounded-full file:border-0 file:bg-green-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-700 hover:file:bg-green-200"
        />
        {(certificationFiles.length > 0 ||
          certificationPreviews.length > 0) && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
            {certificationFiles.length > 0
              ? certificationFiles.map((file, index) => {
                  const isPdf =
                    file.type === "application/pdf" ||
                    file.name.endsWith(".pdf");
                  return (
                    <div
                      key={file.name + index}
                      className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm hover:shadow-md"
                    >
                      {isPdf ? (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-100 text-xs text-gray-500">
                          <span className="material-icons text-3xl">
                            picture_as_pdf
                          </span>
                          PDF File
                        </div>
                      ) : (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Certification ${index + 1}`}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveCertification &&
                          handleRemoveCertification(index)
                        }
                        className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white opacity-80 shadow-md transition hover:bg-red-700 hover:opacity-100"
                        aria-label={`Remove certification ${index + 1}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              : certificationPreviews.map((previewUrl, index) => (
                  <div
                    key={previewUrl}
                    className="group relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm hover:shadow-md"
                  >
                    {previewUrl.endsWith(".pdf") ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-100 text-xs text-gray-500">
                        <span className="material-icons text-3xl">
                          picture_as_pdf
                        </span>
                        PDF File
                      </div>
                    ) : (
                      <img
                        src={previewUrl}
                        alt={`Certification ${index + 1}`}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveCertification &&
                        handleRemoveCertification(index)
                      }
                      className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white opacity-80 shadow-md transition hover:bg-red-700 hover:opacity-100"
                      aria-label={`Remove certification ${index + 1}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceImageUpload;
