export const validateRental = (req, res, next) => {
  const {
    customer_name,
    phone,
    email,
    occasion,
    saree_name,
    saree_category,
    size,
    rental_date,
    return_date,
    rental_amount,
    deposit_amount,
    cleaning_charge,
    status
  } = req.body;

  const errors = {};

  // Required Field Checks
  if (!customer_name || !customer_name.trim()) {
    errors.customer_name = 'Customer name is required';
  }

  if (!phone || !phone.trim()) {
    errors.phone = 'Phone number is required';
  } else {
    // Phone regex - allows international formats, spaces, dashes, parentheses, at least 7 digits
    const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
    if (!phoneRegex.test(phone.trim())) {
      errors.phone = 'Please enter a valid phone number (at least 7 digits)';
    }
  }

  if (!email || !email.trim()) {
    errors.email = 'Email address is required';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
  }

  if (!occasion || !occasion.trim()) {
    errors.occasion = 'Occasion is required';
  }

  if (!saree_name || !saree_name.trim()) {
    errors.saree_name = 'Saree/Garment name is required';
  }

  if (!saree_category || !saree_category.trim()) {
    errors.saree_category = 'Saree/Garment category is required';
  }

  if (!size || !size.trim()) {
    errors.size = 'Size is required';
  }

  // Date Validations
  if (!rental_date) {
    errors.rental_date = 'Rental date is required';
  } else if (isNaN(Date.parse(rental_date))) {
    errors.rental_date = 'Please enter a valid rental date';
  }

  if (!return_date) {
    errors.return_date = 'Return date is required';
  } else if (isNaN(Date.parse(return_date))) {
    errors.return_date = 'Please enter a valid return date';
  }

  if (rental_date && return_date && !isNaN(Date.parse(rental_date)) && !isNaN(Date.parse(return_date))) {
    const rentDate = new Date(rental_date);
    const retDate = new Date(return_date);
    if (retDate < rentDate) {
      errors.return_date = 'Return date must be on or after rental date';
    }
  }

  // Financial Amount Validations
  const parseAmount = (val, fieldName) => {
    if (val === undefined || val === null || val === '') {
      errors[fieldName] = `${fieldName.replace('_', ' ')} is required`;
      return 0;
    }
    const num = parseFloat(val);
    if (isNaN(num)) {
      errors[fieldName] = 'Must be a valid number';
    } else if (num < 0) {
      errors[fieldName] = 'Must be a non-negative amount';
    }
    return num;
  };

  parseAmount(rental_amount, 'rental_amount');
  parseAmount(deposit_amount, 'deposit_amount');
  parseAmount(cleaning_charge, 'cleaning_charge');

  // Status Validation
  if (status) {
    const validStatuses = ['Active', 'Returned', 'Pending', 'Overdue'];
    if (!validStatuses.includes(status)) {
      errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};
