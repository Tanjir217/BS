import { useCallback, useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { Check, Edit3, MapPin, Plus, Trash2, X } from "lucide-react";

import { useCustomerAuth } from "../../context/CustomerAuthContext";
import CustomDropdown from "../../components/ui/CustomDropdown";

import {
  ADDRESS_LABELS,
  createCustomerAddress,
  deleteCustomerAddress,
  getCustomerAddresses,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from "../../services/customerAddressServices";

const EMPTY_FORM = {
  label: ADDRESS_LABELS.HOME,
  recipient_Name: "",
  phone: "",
  address_Line_1: "",
  address_Line_2: "",
  city: "",
  postal_Code: "",
  country: "Bangladesh",
  is_Default: false,
};

function AddressesPage() {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useCustomerAuth();

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [defaultId, setDefaultId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/account/login", {
        replace: true,
        state: { from: "/account/addresses" },
      });
    }
  }, [loading, isAuthenticated, navigate]);

  const loadAddresses = useCallback(async () => {
    if (!user?.$id) {
      return;
    }

    setLoadingAddresses(true);
    setError("");

    try {
      const rows = await getCustomerAddresses(user.$id);
      setAddresses(rows);
    } catch (error) {
      console.error("Failed to load addresses:", error);
      setError(error?.message || "Unable to load your addresses.");
    } finally {
      setLoadingAddresses(false);
    }
  }, [user?.$id]);

  useEffect(() => {
    if (user?.$id) {
      loadAddresses();
    }
  }, [user?.$id, loadAddresses]);

  function openCreateForm() {
    setEditingAddressId(null);
    setForm({
      ...EMPTY_FORM,
    });
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function openEditForm(address) {
    setEditingAddressId(address.$id);
    setForm({
      label: Object.values(ADDRESS_LABELS).includes(
        String(address.label || "").trim().toLowerCase(),
      )
        ? String(address.label || "").trim().toLowerCase()
        : ADDRESS_LABELS.HOME,
      recipient_Name: address.recipient_Name || "",
      phone: address.phone || "",
      address_Line_1: address.address_Line_1 || "",
      address_Line_2: address.address_Line_2 || "",
      city: address.city || "",
      postal_Code: address.postal_Code || "",
      country: address.country || "Bangladesh",
      is_Default: Boolean(address.is_Default),
    });
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditingAddressId(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!user?.$id) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingAddressId) {
        await updateCustomerAddress(user.$id, editingAddressId, form);
        setSuccess("Address updated successfully.");
      } else {
        await createCustomerAddress(user.$id, form);
        setSuccess("Address added successfully.");
      }

      await loadAddresses();

      setFormOpen(false);
      setEditingAddressId(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      console.error("Address save failed:", error);
      setError(error?.message || "Unable to save this address.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(addressId) {
    if (!user?.$id) {
      return;
    }

    setDefaultId(addressId);
    setError("");
    setSuccess("");

    try {
      await setDefaultCustomerAddress(user.$id, addressId);
      await loadAddresses();
      setSuccess("Default address updated.");
    } catch (error) {
      console.error("Default address update failed:", error);
      setError(error?.message || "Unable to change the default address.");
    } finally {
      setDefaultId(null);
    }
  }

  async function handleDelete(addressId) {
    if (!user?.$id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this address?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(addressId);
    setError("");
    setSuccess("");

    try {
      await deleteCustomerAddress(user.$id, addressId);
      await loadAddresses();
      setSuccess("Address deleted successfully.");
    } catch (error) {
      console.error("Address deletion failed:", error);
      setError(error?.message || "Unable to delete this address.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <main className="account-page">
      <div className="account-page__container">
        <div className="account-addresses">
          <div className="account-addresses__header">
            <div className="account-page__intro">
              <p>My Account / Addresses</p>
              <h1>Delivery addresses.</h1>
              <span>Save your delivery information for a faster checkout.</span>
            </div>

            {!formOpen && (
              <button
                type="button"
                className="account-addresses__add"
                onClick={openCreateForm}
              >
                <Plus size={16} />
                Add address
              </button>
            )}
          </div>

          {error && (
            <div className="account-addresses__message account-addresses__message--error">
              {error}
            </div>
          )}

          {success && (
            <div className="account-addresses__message account-addresses__message--success">
              {success}
            </div>
          )}

          {formOpen && (
            <form className="account-address-form" onSubmit={handleSubmit}>
              <div className="account-address-form__header">
                <div>
                  <p>{editingAddressId ? "Edit address" : "New address"}</p>
                  <h2>Delivery details.</h2>
                </div>

                <button
                  type="button"
                  className="account-address-form__close"
                  onClick={closeForm}
                  disabled={saving}
                  aria-label="Close address form"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="account-address-form__fields">
                <label>
                  <span>Address type</span>
                  <CustomDropdown
                    value={form.label}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, label: value }))
                    }
                    options={[
                      { value: ADDRESS_LABELS.HOME, label: "Home" },
                      { value: ADDRESS_LABELS.OFFICE, label: "Office" },
                      { value: ADDRESS_LABELS.OTHER, label: "Other" },
                    ]}
                    className="w-full"
                    menuClassName="w-full"
                  />
                </label>

                <label>
                  <span>Recipient name</span>
                  <input
                    name="recipient_Name"
                    value={form.recipient_Name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                </label>

                <label>
                  <span>Phone</span>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    inputMode="tel"
                    required
                  />
                </label>

                <label className="account-address-form__wide">
                  <span>Address line 1</span>
                  <input
                    name="address_Line_1"
                    value={form.address_Line_1}
                    onChange={handleChange}
                    autoComplete="address-line1"
                    required
                  />
                </label>

                <label className="account-address-form__wide">
                  <span>Address line 2<small>Optional</small></span>
                  <input
                    name="address_Line_2"
                    value={form.address_Line_2}
                    onChange={handleChange}
                    autoComplete="address-line2"
                  />
                </label>

                <label>
                  <span>City</span>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    autoComplete="address-level2"
                    required
                  />
                </label>

                <label>
                  <span>Postal code</span>
                  <input
                    name="postal_Code"
                    value={form.postal_Code}
                    onChange={handleChange}
                    autoComplete="postal-code"
                    required
                  />
                </label>

                <label>
                  <span>Country</span>
                  <input
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    autoComplete="country-name"
                    required
                  />
                </label>
              </div>

              <label className="account-address-form__default">
                <input
                  type="checkbox"
                  name="is_Default"
                  checked={form.is_Default}
                  onChange={handleChange}
                />
                <span>Make this my default delivery address</span>
              </label>

              <div className="account-address-form__actions">
                <button type="button" onClick={closeForm} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingAddressId
                      ? "Update address"
                      : "Save address"}
                </button>
              </div>
            </form>
          )}

          {!formOpen && (
            <>
              {loadingAddresses ? (
                <div className="account-addresses__loading">Loading your addresses...</div>
              ) : addresses.length === 0 ? (
                <div className="account-addresses__empty">
                  <MapPin size={30} />
                  <h2>No saved addresses.</h2>
                  <p>Add your first delivery address to make checkout faster.</p>
                  <button type="button" onClick={openCreateForm}>Add your first address</button>
                </div>
              ) : (
                <div className="account-addresses__list">
                  {addresses.map((address) => (
                    <article
                      className={`account-address-card ${address.is_Default ? "is-default" : ""}`}
                      key={address.$id}
                    >
                      <div className="account-address-card__top">
                        <div>
                          <div className="account-address-card__label">
                            <MapPin size={15} />
                            <span>{address.label}</span>
                          </div>

                          {address.is_Default && (
                            <span className="account-address-card__default">
                              <Check size={13} />
                              Default
                            </span>
                          )}
                        </div>

                        <div className="account-address-card__actions">
                          <button
                            type="button"
                            onClick={() => openEditForm(address)}
                            aria-label={`Edit ${address.label} address`}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(address.$id)}
                            disabled={deletingId === address.$id}
                            aria-label={`Delete ${address.label} address`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="account-address-card__body">
                        <strong>{address.recipient_Name}</strong>
                        <span>{address.phone}</span>
                        <span>{address.address_Line_1}</span>
                        {address.address_Line_2 && <span>{address.address_Line_2}</span>}
                        <span>{address.city}, {address.postal_Code}</span>
                        <span>{address.country}</span>
                      </div>

                      {!address.is_Default && (
                        <button
                          type="button"
                          className="account-address-card__set-default"
                          onClick={() => handleSetDefault(address.$id)}
                          disabled={defaultId === address.$id}
                        >
                          {defaultId === address.$id ? "Updating..." : "Set as default"}
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          <p className="account-addresses__back">
            <Link to="/account">← Back to Account</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default AddressesPage;
