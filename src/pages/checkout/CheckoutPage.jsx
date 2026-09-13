import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    Link,
    useNavigate,
  } from "react-router-dom";
  
  import { useCart } from "../../context/CartContext";
  
  function formatPrice(value) {
    return Number(
      value || 0,
    ).toLocaleString("en-BD", {
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
  };
  
  function CheckoutPage() {
    const navigate =
      useNavigate();
  
    const {
      items,
      itemCount,
      subtotal,
      isValidating,
      hasUnavailableItems,
      validateCart,
    } = useCart();
  
    const [form, setForm] =
      useState(initialForm);
  
    const [deliveryMethod, setDeliveryMethod] =
      useState("standard");
  
    const [
      formError,
      setFormError,
    ] = useState("");
  
    useEffect(() => {
      if (items.length === 0) {
        return;
      }
  
      validateCart();
  
      // Checkout performs an
      // initial cart validation.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
    useEffect(() => {
      if (items.length === 0) {
        navigate("/cart", {
          replace: true,
        });
      }
    }, [
      items.length,
      navigate,
    ]);
  
    const deliveryFee = useMemo(() => {
      if (deliveryMethod === "standard") {
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
  
    function handleChange(event) {
      const {
        name,
        value,
      } = event.target;
  
      setForm(
        (current) => ({
          ...current,
          [name]: value,
        }),
      );
  
      if (formError) {
        setFormError("");
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
        "area",
      ];
  
      const missingField =
        requiredFields.find(
          (field) =>
            !form[field].trim(),
        );
  
      if (missingField) {
        setFormError(
          "Please complete all required delivery information.",
        );
  
        return false;
      }
  
      return true;
    }
  
    function handleContinue() {
      if (isValidating) {
        return;
      }
  
      if (
        hasUnavailableItems
      ) {
        setFormError(
          "Please remove unavailable items from your bag before continuing.",
        );
  
        return;
      }
  
      if (!validateForm()) {
        return;
      }
  
      /*
        Payment/order creation
        will be connected after
        the checkout foundation
        is complete.
      */
  
      setFormError(
        "Checkout information is ready. Payment will be connected in the next commerce section.",
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
            onSubmit={(event) => {
              event.preventDefault();
              handleContinue();
            }}
          >
            <section className="checkout-section">
              <div className="checkout-section__heading">
                <span>
                  01
                </span>
  
                <div>
                  <p>
                    Contact
                  </p>
  
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
                    value={form.email}
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
                    value={form.phone}
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
                <span>
                  02
                </span>
  
                <div>
                  <p>
                    Delivery
                  </p>
  
                  <h2>
                    Delivery Address
                  </h2>
                </div>
              </div>
  
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
                    Area *
                  </span>
  
                  <input
                    type="text"
                    name="area"
                    value={form.area}
                    onChange={
                      handleChange
                    }
                    required
                  />
                </label>
  
                <label>
                  <span>
                    City *
                  </span>
  
                  <input
                    type="text"
                    name="city"
                    value={form.city}
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
              </div>
            </section>
  
            <section className="checkout-section">
              <div className="checkout-section__heading">
                <span>
                  03
                </span>
  
                <div>
                  <p>
                    Shipping
                  </p>
  
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
                        event.target
                          .value,
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
                        event.target
                          .value,
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
                hasUnavailableItems
              }
            >
              {isValidating
                ? "Checking your bag..."
                : "Continue to Payment"}
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
              {items.map(
                (item) => (
                  <div
                    className="checkout-summary__item"
                    key={
                      item.productId
                    }
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
                ),
              )}
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