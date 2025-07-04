
export const validatePaymentData = (materialId, email, phone, amount) => {
  const errors = [];

  if (!materialId) {
    errors.push("Material ID is required");
  }

  if (!email || !email.trim()) {
    errors.push("Email is required");
  } else {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email.trim())) {
      errors.push("Invalid email format");
    }
  }

  if (!phone) {
    errors.push("Phone number is required");
  } else {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.toString().replace(/\s+/g, ''))) {
      errors.push("Phone number must be exactly 10 digits");
    }
  }

  if (!amount || amount <= 0) {
    errors.push("Valid amount is required");
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

export const formatCurrency = (amount) => {
  if (!amount) return "₹0.00";
  
  // Convert to number if it's a string
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return "₹0.00";
  
  return `₹${numericAmount.toFixed(2)}`;
};

export const createPaymentPayload = (materialId, email, phone, userId, amount, materialName) => {
  return {
    materialId: materialId,
    userEmail: email.trim(),
    phoneNumber: phone.toString().replace(/\s+/g, ''),
    userId: userId,
    amount: parseFloat(amount),
    materialName: materialName || 'Material Purchase',
    orderId: generateOrderId(),
  };
};

const generateOrderId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORDER_${timestamp}_${random}`;
};