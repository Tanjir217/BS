import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

import {
  getCustomerAddresses,
} from "../../services/customerAddressServices";

import {
  createOrder,
  PAYMENT_METHODS,
} from "../../services/orderServices";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 0,
  });
}

const initialForm = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  apartment: "",
  city: "",
  area: "",
  postalCode: "",
  country: "Bangladesh",
};

function getNameParts(name = "") {
  const parts = String(name).trim().split(/\s+/);

  if (parts.length === 0) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    items,
    itemCount,
    subtotal,
    isValidating,
    validationError,
    hasUnavailableItems,
    hasCartChanges,
    validateCart,
    clearCart,
  } = useCart();

  const {
    user,
    loading: authLoading,
    isAuthenticated,
  } = useCustomerAuth();

  const [form, setForm] =
    useState(initialForm);

  const [addresses, setAddresses] =
    useState([]);

  const [addressesLoading, setAddressesLoading] =
    useState(false);

  const [selectedAddressId, setSelectedAddressId] =
    useState("");

  const [deliveryMethod, setDeliveryMethod] =
    useState("standard");

  const [paymentMethod] =
    useState(PAYMENT_METHODS.COD);

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Redirect unauthenticated customers
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/account/login", {
        replace: true,
        state: {
          from: location.pathname,
        },
      });
    }
  }, [
    authLoading,
    isAuthenticated,
    navigate,
    location.pathname,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Load saved addresses
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      authLoading ||
      !isAuthenticated ||
      !user?.$id
    ) {
      return;
    }

    let cancelled = false;

    async function loadAddresses() {
      setAddressesLoading(true);

      try {
        const customerAddresses =
          await getCustomerAddresses(user.$id);

        if (cancelled) {
          return;
        }

        setAddresses(customerAddresses);

        const defaultAddress =
          customerAddresses.find(
            (address) => address.is_Default,
          ) ||
          customerAddresses[0];

        if (defaultAddress) {
          setSelectedAddressId(
            defaultAddress.$id,
          );
        
          const {
            firstName,
            lastName,
          } = getNameParts(
            defaultAddress.recipient_Name,
          );
        
          setForm((current) => ({
            ...current,
            firstName,
            lastName,
            phone:
              defaultAddress.phone ||
              current.phone,
            address:
              defaultAddress.address_Line_1 ||
              "",
            apartment:
              defaultAddress.address_Line_2 ||
              "",
            city:
              defaultAddress.city ||
              "",
            postalCode:
              defaultAddress.postal_Code ||
              "",
            country:
              defaultAddress.country ||
              "Bangladesh",
          }));

          applyAddress(defaultAddress);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Checkout address loading failed:",
          error,
        );

        setFormError(
          "We could not load your saved addresses. You can enter your delivery information manually.",
        );
      } finally {
        if (!cancelled) {
          setAddressesLoading(false);
        }
      }
    }

    loadAddresses();

    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    isAuthenticated,
    user?.$id,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Prefill customer information
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!user) {
      return;
    }

    const {
      firstName,
      lastName,
    } = getNameParts(user.name);

    setForm((current) => ({
      ...current,
      email:
        current.email ||
        user.email ||
        "",
      firstName:
        current.firstName ||
        firstName,
      lastName:
        current.lastName ||
        lastName,
      phone:
        current.phone ||
        localStorage.getItem(
          "bayzid-customer-phone",
        ) ||
        "",
    }));
  }, [user]);

  /*
  |--------------------------------------------------------------------------
  | Initial cart validation
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      authLoading ||
      !isAuthenticated ||
      items.length === 0
    ) {
      return;
    }

    validateCart();

    // The cart context owns validation.
    // This effect intentionally runs once when
    // checkout becomes available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authLoading,
    isAuthenticated,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Empty cart protection
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !authLoading &&
      items.length === 0
    ) {
      navigate("/cart", {
        replace: true,
      });
    }
  }, [
    authLoading,
    items.length,
    navigate,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Delivery price
  |--------------------------------------------------------------------------
  */

  const deliveryFee = useMemo(() => {
    if (
      deliveryMethod === "standard"
    ) {
      return 100;
    }

    return 150;
  }, [
    deliveryMethod,
  ]);

  const total = useMemo(
    () =>
      subtotal +
      deliveryFee,
    [
      subtotal,
      deliveryFee,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | Apply saved address
  |--------------------------------------------------------------------------
  */

  function applyAddress(address) {
    if (!address) {
      return;
    }

    const {
      firstName,
      lastName,
    } = getNameParts(
      address.recipient_Name,
    );

    setForm((current) => ({
      ...current,

      firstName,
      lastName,

      phone:
        address.phone ||
        current.phone,

      address:
        address.address_Line_1 ||
        "",

      apartment:
        address.address_Line_2 ||
        "",

      city:
        address.city ||
        "",

      postalCode:
        address.postal_Code ||
        "",

      country:
        address.country ||
        "Bangladesh",
    }));

    setFormError("");
  }

  function handleAddressSelect(
    event,
  ) {
    const addressId =
      event.target.value;

    setSelectedAddressId(
      addressId,
    );

    const address =
      addresses.find(
        (item) =>
          item.$id === addressId,
      );

    if (address) {
      applyAddress(address);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Form
  |--------------------------------------------------------------------------
  */

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }

    if (
      name === "address" ||
      name === "city" ||
      name === "postalCode"
    ) {
      setSelectedAddressId("");
    }
  }

  function validateForm() {
    const requiredFields = [
      "email",
      "firstName",
      "lastName",
      "phone",
      "address",
      "city",
    ];

    const missingField =
      requiredFields.find(
        (field) =>
          !String(
            form[field] || "",
          ).trim(),
      );

    if (missingField) {
      setFormError(
        "Please complete all required delivery information.",
      );

      return false;
    }

    if (
      !form.email.includes("@")
    ) {
      setFormError(
        "Please enter a valid email address.",
      );

      return false;
    }

    return true;
  }

  /*
  |--------------------------------------------------------------------------
  | Final cart validation
  |--------------------------------------------------------------------------
  */

  async function performFinalValidation() {
    const validationResults =
      await validateCart();

    if (!validationResults) {
      setFormError(
        "We could not verify your bag. Please try again.",
      );

      return false;
    }

    const unavailable =
      validationResults.some(
        (item) =>
          item.validationStatus ===
            "unavailable" ||
          item.validationStatus ===
            "out-of-stock",
      );

    if (unavailable) {
      setFormError(
        "One or more products are no longer available. Please review your bag.",
      );

      return false;
    }

    const changed =
      validationResults.some(
        (item) =>
          item.validationStatus ===
            "price-changed" ||
          item.validationStatus ===
            "stock-reduced",
      );

    if (changed) {
      setFormError(
        "Your bag changed while you were checking out. Please review the updated prices or quantities before placing the order.",
      );

      return false;
    }

    return true;
  }

  /*
  |--------------------------------------------------------------------------
  | Create order
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      isSubmitting ||
      isValidating
    ) {
      return;
    }

    setFormError("");

    if (
      !isAuthenticated ||
      !user?.$id
    ) {
      navigate("/account/login", {
        replace: true,
        state: {
          from: "/checkout",
        },
      });

      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const cartIsValid =
        await performFinalValidation();

      if (!cartIsValid) {
        return;
      }

      const shippingAddress =
        [
          form.address,
          form.apartment,
          form.area,
        ]
          .map((value) =>
            String(value || "").trim(),
          )
          .filter(Boolean)
          .join(", ");

      const orderItems =
        items.map((item) => ({
          productId:
            item.productId,
          quantity:
            item.quantity,
          expectedPrice:
            item.price,
        }));

      const order =
        await createOrder({
          customer_ID: user.$id,

          customer_Name:
            [
              form.firstName,
              form.lastName,
            ]
              .map((value) =>
                String(
                  value || "",
                ).trim(),
              )
              .filter(Boolean)
              .join(" "),

          customer_Email:
            form.email.trim(),

          customer_Phone:
            form.phone.trim(),

          shipping_Address:
            shippingAddress,

          shipping_City:
            form.city.trim(),

          shipping_Postal_Code:
            form.postalCode.trim(),

          shipping_Cost:
            deliveryFee,

          discount: 0,

          payment_Method:
            paymentMethod,

          notes: "",

          items: orderItems,
        });

      /*
      |--------------------------------------------------------------------------
      | Only clear the cart after the order
      | has been successfully created.
      |--------------------------------------------------------------------------
      */

      clearCart();

      navigate(
        `/account/orders/${order.order.$id}`,
        {
          replace: true,
          state: {
            orderCreated: true,
          },
        },
      );
    } catch (error) {
      console.error(
        "Checkout order creation failed:",
        error,
      );

      setFormError(
        error?.message ||
          "We could not place your order. Please review your information and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (
    authLoading ||
    !isAuthenticated
  ) {
    return (
      <main className="checkout-page">
        <div className="checkout-page__loading">
          Loading checkout...
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <main className="checkout-page">
      <header className="checkout-page__header">
        <div>
          <p className="checkout-page__eyebrow">
            Bayzid Shoes
          </p>

          <h1>
            Checkout
          </h1>
        </div>

        <Link
          to="/cart"
          className="checkout-page__back"
        >
          Back to Bag
        </Link>
      </header>

      <div className="checkout-page__layout">
        <form
          className="checkout-form"
          onSubmit={
            handleSubmit
          }
        >
          <section className="checkout-section">
            <div className="checkout-section__heading">
              <span>01</span>

              <div>
                <p>Contact</p>

                <h2>
                  Contact Information
                </h2>
              </div>
            </div>

            <div className="checkout-grid">
              <label>
                <span>
                  Email *
                </span>

                <input
                  type="email"
                  name="email"
                  value={
                    form.email
                  }
                  onChange={
                    handleChange
                  }
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                <span>
                  Phone *
                </span>

                <input
                  type="tel"
                  name="phone"
                  value={
                    form.phone
                  }
                  onChange={
                    handleChange
                  }
                  autoComplete="tel"
                  required
                />
              </label>
            </div>
          </section>

          <section className="checkout-section">
            <div className="checkout-section__heading">
              <span>02</span>

              <div>
                <p>Delivery</p>

                <h2>
                  Delivery Address
                </h2>
              </div>
            </div>

            {addresses.length > 0 && (
              <div className="checkout-grid">
                <label className="checkout-grid__full">
                  <span>
                    Saved Address
                  </span>

                  <select
                    value={
                      selectedAddressId
                    }
                    onChange={
                      handleAddressSelect
                    }
                  >
                    <option value="">
                      Enter a new address
                    </option>

                    {addresses.map(
                      (address) => (
                        <option
                          key={
                            address.$id
                          }
                          value={
                            address.$id
                          }
                        >
                          {address.label
                            ?.charAt(0)
                            .toUpperCase() +
                            address.label?.slice(
                              1,
                            )}{" "}
                          —{" "}
                          {
                            address.address_Line_1
                          }
                          {address.is_Default
                            ? " (Default)"
                            : ""}
                        </option>
                      ),
                    )}
                  </select>

                  {addressesLoading && (
                    <small>
                      Loading saved addresses...
                    </small>
                  )}
                </label>
              </div>
            )}

            <div className="checkout-grid">
              <label>
                <span>
                  First Name *
                </span>

                <input
                  type="text"
                  name="firstName"
                  value={
                    form.firstName
                  }
                  onChange={
                    handleChange
                  }
                  autoComplete="given-name"
                  required
                />
              </label>

              <label>
                <span>
                  Last Name *
                </span>

                <input
                  type="text"
                  name="lastName"
                  value={
                    form.lastName
                  }
                  onChange={
                    handleChange
                  }
                  autoComplete="family-name"
                  required
                />
              </label>

              <label className="checkout-grid__full">
                <span>
                  Address *
                </span>

                <input
                  type="text"
                  name="address"
                  value={
                    form.address
                  }
                  onChange={
                    handleChange
                  }
                  autoComplete="street-address"
                  required
                />
              </label>

              <label>
                <span>
                  Apartment / Floor
                </span>

                <input
                  type="text"
                  name="apartment"
                  value={
                    form.apartment
                  }
                  onChange={
                    handleChange
                  }
                />
              </label>

              <label>
                <span>
                  Area
                </span>

                <input
                  type="text"
                  name="area"
                  value={
                    form.area
                  }
                  onChange={
                    handleChange
                  }
                />
              </label>

              <label>
                <span>
                  City *
                </span>

                <input
                  type="text"
                  name="city"
                  value={
                    form.city
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Postal Code
                </span>

                <input
                  type="text"
                  name="postalCode"
                  value={
                    form.postalCode
                  }
                  onChange={
                    handleChange
                  }
                />
              </label>

              <label>
                <span>
                  Country
                </span>

                <input
                  type="text"
                  name="country"
                  value={
                    form.country
                  }
                  onChange={
                    handleChange
                  }
                />
              </label>
            </div>
          </section>

          <section className="checkout-section">
            <div className="checkout-section__heading">
              <span>03</span>

              <div>
                <p>Shipping</p>

                <h2>
                  Delivery Method
                </h2>
              </div>
            </div>

            <div className="checkout-delivery">
              <label
                className={
                  deliveryMethod ===
                  "standard"
                    ? "is-selected"
                    : ""
                }
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="standard"
                  checked={
                    deliveryMethod ===
                    "standard"
                  }
                  onChange={(event) =>
                    setDeliveryMethod(
                      event.target.value,
                    )
                  }
                />

                <span>
                  <strong>
                    Standard Delivery
                  </strong>

                  <small>
                    ৳100
                  </small>
                </span>
              </label>

              <label
                className={
                  deliveryMethod ===
                  "express"
                    ? "is-selected"
                    : ""
                }
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="express"
                  checked={
                    deliveryMethod ===
                    "express"
                  }
                  onChange={(event) =>
                    setDeliveryMethod(
                      event.target.value,
                    )
                  }
                />

                <span>
                  <strong>
                    Express Delivery
                  </strong>

                  <small>
                    ৳150
                  </small>
                </span>
              </label>
            </div>
          </section>

          <section className="checkout-section">
            <div className="checkout-section__heading">
              <span>04</span>

              <div>
                <p>Payment</p>

                <h2>
                  Payment Method
                </h2>
              </div>
            </div>

            <div className="checkout-delivery">
              <label className="is-selected">
                <input
                  type="radio"
                  checked
                  readOnly
                />

                <span>
                  <strong>
                    Cash on Delivery
                  </strong>

                  <small>
                    Pay when your order arrives
                  </small>
                </span>
              </label>
            </div>
          </section>

          {validationError && (
            <div className="checkout-form__error">
              {validationError}
            </div>
          )}

          {hasUnavailableItems && (
            <div className="checkout-form__error">
              Some products in your bag are no longer
              available. Please review your bag.
            </div>
          )}

          {hasCartChanges && (
            <div className="checkout-form__error">
              Your bag has changed. Please review
              the latest prices or quantities before
              placing the order.
            </div>
          )}

          {formError && (
            <div className="checkout-form__error">
              {formError}
            </div>
          )}

          <button
            type="submit"
            className="checkout-form__submit"
            disabled={
              isValidating ||
              isSubmitting ||
              hasUnavailableItems ||
              hasCartChanges
            }
          >
            {isSubmitting
              ? "Placing order..."
              : isValidating
                ? "Checking your bag..."
                : "Place Order"}
          </button>
        </form>

        <aside className="checkout-summary">
          <div className="checkout-summary__heading">
            <span>
              {itemCount}{" "}
              {itemCount === 1
                ? "item"
                : "items"}
            </span>

            <Link to="/cart">
              Edit
            </Link>
          </div>

          <div className="checkout-summary__items">
            {items.map((item) => (
              <div
                className="checkout-summary__item"
                key={item.productId}
              >
                <div>
                  <strong>
                    {item.name}
                  </strong>

                  <span>
                    Qty{" "}
                    {item.quantity}
                  </span>
                </div>

                <span>
                  ৳
                  {formatPrice(
                    item.price *
                      item.quantity,
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="checkout-summary__row">
            <span>
              Subtotal
            </span>

            <span>
              ৳
              {formatPrice(
                subtotal,
              )}
            </span>
          </div>

          <div className="checkout-summary__row">
            <span>
              Delivery
            </span>

            <span>
              ৳
              {formatPrice(
                deliveryFee,
              )}
            </span>
          </div>

          <div className="checkout-summary__total">
            <span>
              Total
            </span>

            <strong>
              ৳
              {formatPrice(
                total,
              )}
            </strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default CheckoutPage;