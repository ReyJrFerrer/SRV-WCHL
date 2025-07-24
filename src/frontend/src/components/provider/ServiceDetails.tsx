import React from "react";
import { TrashIcon } from "@heroicons/react/24/solid";
import { ServiceCategory } from "../../services/serviceCanisterService";

interface ServiceDetailsProps {
  formData: {
    serviceOfferingTitle: string;
    categoryId: string;
    servicePackages: {
      id: string;
      name: string;
      description: string;
      price: string;
      currency: string;
      isPopular: boolean;
    }[];
  };
  categories: ServiceCategory[];
  loadingCategories: boolean;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  handlePackageChange: (
    index: number,
    field: string,
    value: string | boolean,
  ) => void;
  addPackage: () => void;
  removePackage: (id: string) => void;
}

const ServiceDetails: React.FC<ServiceDetailsProps> = ({
  formData,
  categories,
  loadingCategories,
  handleChange,
  handlePackageChange,
  addPackage,
  removePackage,
}) => {
  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left: Service Details & Category */}
        <section className="rounded-xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
          <div className="space-y-8">
            <section className="rounded-xl border border-gray-100 bg-transparent p-0 shadow-none">
              <h2 className="mb-4 text-lg font-bold text-blue-700">
                Service Details <span className="text-red-500">*</span>
              </h2>
              <div className="space-y-2">
                <input
                  type="text"
                  name="serviceOfferingTitle"
                  id="serviceOfferingTitle"
                  value={formData.serviceOfferingTitle}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Professional Hair Styling"
                />
              </div>
            </section>

            <section className="rounded-xl border border-gray-100 bg-transparent p-0 shadow-none">
              <h2 className="mb-2 text-lg font-bold text-blue-700">
                Category <span className="text-red-500">*</span>
              </h2>
              <div>
                <select
                  name="categoryId"
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {loadingCategories ? (
                    <option disabled>Loading categories...</option>
                  ) : (
                    categories
                      .filter((cat) => !cat.parentId)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))
                  )}
                </select>
              </div>
            </section>
          </div>
        </section>

        {/* Right: Service Packages */}
        <div>
          <section className="rounded-xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-blue-700">
              Service Packages <span className="text-red-500">*</span>
            </h2>
            <fieldset>
              <div className="space-y-6">
                {formData.servicePackages.map((pkg, index) => (
                  <div
                    key={pkg.id}
                    className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-md font-bold text-gray-800">
                        Package {index + 1}
                      </h4>
                      {formData.servicePackages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePackage(pkg.id)}
                          className="rounded-full bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700"
                          title="Remove package"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor={`pkgName-${pkg.id}`}
                          className="block text-xs font-medium text-gray-600"
                        >
                          Package Name<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id={`pkgName-${pkg.id}`}
                          value={pkg.name}
                          onChange={(e) =>
                            handlePackageChange(index, "name", e.target.value)
                          }
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`pkgDesc-${pkg.id}`}
                          className="block text-xs font-medium text-gray-600"
                        >
                          Description<span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id={`pkgDesc-${pkg.id}`}
                          value={pkg.description}
                          onChange={(e) =>
                            handlePackageChange(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          rows={3}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Describe what's included in this package."
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`pkgPrice-${pkg.id}`}
                          className="block text-xs font-medium text-gray-600"
                        >
                          Price (PHP)<span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id={`pkgPrice-${pkg.id}`}
                          value={pkg.price}
                          onChange={(e) =>
                            handlePackageChange(index, "price", e.target.value)
                          }
                          required
                          min="0"
                          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addPackage}
                className="mt-6 w-full rounded-lg border border-dashed border-blue-500 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
              >
                + Add Package
              </button>
            </fieldset>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;
