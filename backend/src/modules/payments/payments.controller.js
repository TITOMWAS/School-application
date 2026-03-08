const paymentsService = require("./payments.service");


const createFeeStructure = async (req, res, next) => {
  try {
    const { name, description, academicYearId, amount, isRecurring, dueDate, category, isActive } = req.body;
    
    const fee = await paymentsService.createFeeStructure({
      name,
      description,
      academicYearId: parseInt(academicYearId),
      amount: parseFloat(amount),
      isRecurring,
      dueDate,
      category,
      isActive
    });

    res.status(201).json({
      success: true,
      message: "Fee structure created successfully",
      data: fee
    });
  } catch (error) {
    next(error);
  }
};

const getFeeStructuresByYear = async (req, res, next) => {
  try {
    const { academicYearId } = req.params;
    const { activeOnly = false } = req.query;

    const fees = await paymentsService.getFeeStructuresByYear(
      parseInt(academicYearId),
      activeOnly !== "false"
    );

    res.json({
      success: true,
      data: fees
    });
  } catch (error) {
    next(error);
  }
};

const getFeeStructureById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fee = await paymentsService.getFeeStructureById(parseInt(id));

    res.json({
      success: true,
      data: fee
    });
  } catch (error) {
    next(error);
  }
};

const updateFeeStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, amount, isRecurring, dueDate, category, isActive } = req.body;

    const fee = await paymentsService.updateFeeStructure(parseInt(id), {
      name,
      description,
      amount: amount ? parseFloat(amount) : undefined,
      isRecurring,
      dueDate,
      category,
      isActive
    });

    res.json({
      success: true,
      message: "Fee structure updated successfully",
      data: fee
    });
  } catch (error) {
    next(error);
  }
};

const deleteFeeStructure = async (req, res, next) => {
  try {
    const { id } = req.params;
    await paymentsService.deleteFeeStructure(parseInt(id));

    res.json({
      success: true,
      message: "Fee structure deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};


const assignFeeToStudent = async (req, res, next) => {
  try {
    const { studentId, feeStructureId, academicYearId, classId } = req.body;

    const fee = await paymentsService.assignFeeToStudent({
      studentId: parseInt(studentId),
      feeStructureId: parseInt(feeStructureId),
      academicYearId: parseInt(academicYearId),
      classId: classId ? parseInt(classId) : null
    });

    res.status(201).json({
      success: true,
      message: "Fee assigned to student successfully",
      data: fee
    });
  } catch (error) {
    next(error);
  }
};

const assignFeeToClass = async (req, res, next) => {
  try {
    const { feeStructureId, classId, academicYearId } = req.body;

    const fees = await paymentsService.assignFeeToClass(
      parseInt(feeStructureId),
      parseInt(classId),
      parseInt(academicYearId)
    );

    res.status(201).json({
      success: true,
      message: `Fee assigned to ${fees.length} students successfully`,
      data: fees
    });
  } catch (error) {
    next(error);
  }
};

const getStudentFees = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicYearId } = req.query;

    const fees = await paymentsService.getStudentFees(
      parseInt(studentId),
      academicYearId ? parseInt(academicYearId) : null
    );

    res.json({
      success: true,
      data: fees
    });
  } catch (error) {
    next(error);
  }
};

const getClassFees = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { academicYearId } = req.query;

    const fees = await paymentsService.getClassFees(
      parseInt(classId),
      parseInt(academicYearId)
    );

    res.json({
      success: true,
      data: fees
    });
  } catch (error) {
    next(error);
  }
};

const updateStudentFee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, paidAmount, dueDate, status, paymentMethod, notes } = req.body;

    const fee = await paymentsService.updateStudentFee(parseInt(id), {
      amount: amount ? parseFloat(amount) : undefined,
      paidAmount: paidAmount ? parseFloat(paidAmount) : undefined,
      dueDate,
      status,
      paymentMethod,
      notes
    });

    res.json({
      success: true,
      message: "Student fee updated successfully",
      data: fee
    });
  } catch (error) {
    next(error);
  }
};


const createPayment = async (req, res, next) => {
  try {
    const { studentFeeId, studentId, amount, paymentMethod, transactionId, phoneNumber } = req.body;

    const payment = await paymentsService.createPayment({
      studentFeeId: parseInt(studentFeeId),
      studentId: parseInt(studentId),
      amount: parseFloat(amount),
      paymentMethod,
      transactionId,
      phoneNumber
    });

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

const completePayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await paymentsService.completePayment(parseInt(id));

    res.json({
      success: true,
      message: "Payment completed successfully",
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await paymentsService.getPaymentById(parseInt(id));

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentsByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { academicYearId } = req.query;

    const payments = await paymentsService.getPaymentsByStudent(
      parseInt(studentId),
      academicYearId ? parseInt(academicYearId) : null
    );

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};

const handlePaymentCallback = async (req, res, next) => {
  try {
    const { transactionId, status, amount, phoneNumber } = req.body;

    const result = await paymentsService.handlePaymentCallback({
      transactionId,
      status,
      amount: parseFloat(amount),
      phoneNumber,
      gatewayResponse: req.body
    });

    res.json({
      success: true,
      message: "Payment callback processed",
      data: result
    });
  } catch (error) {
    next(error);
  }
};


const getFeeCollectionReport = async (req, res, next) => {
  try {
    const { academicYearId } = req.params;
    const { classId, termId } = req.query;

    const report = await paymentsService.getFeeCollectionReport(
      parseInt(academicYearId),
      classId ? parseInt(classId) : null,
      termId ? parseInt(termId) : null
    );

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

const createReconciliation = async (req, res, next) => {
  try {
    const { academicYearId, reconciliationDate, totalExpected, totalCollected, totalPending, totalRefunded, notes } = req.body;
    const preparedBy = req.user.id;

    const reconciliation = await paymentsService.createReconciliation({
      academicYearId: parseInt(academicYearId),
      reconciliationDate,
      totalExpected: parseFloat(totalExpected),
      totalCollected: parseFloat(totalCollected),
      totalPending: parseFloat(totalPending),
      totalRefunded: totalRefunded ? parseFloat(totalRefunded) : 0,
      notes
    }, preparedBy);

    res.status(201).json({
      success: true,
      message: "Reconciliation created successfully",
      data: reconciliation
    });
  } catch (error) {
    next(error);
  }
};

const getReconciliations = async (req, res, next) => {
  try {
    const { academicYearId } = req.params;

    const reconciliations = await paymentsService.getReconciliations(parseInt(academicYearId));

    res.json({
      success: true,
      data: reconciliations
    });
  } catch (error) {
    next(error);
  }
};


const initializePaystackPayment = async (req, res, next) => {
  try {
    const { studentFeeId, email, callbackUrl } = req.body;

    const result = await paymentsService.initializePaystackPayment({
      studentFeeId: parseInt(studentFeeId),
      email,
      callbackUrl
    });

    res.json({
      success: true,
      message: "Payment initialized successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const verifyPaystackPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;

    const payment = await paymentsService.verifyPaystackPayment(reference);

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

const handlePaystackWebhook = async (req, res, next) => {
  try {
    const result = await paymentsService.handlePaystackWebhook(req.body);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const createPaystackPaymentLink = async (req, res, next) => {
  try {
    const { studentFeeId, title, description } = req.body;

    const result = await paymentsService.createPaystackPaymentLink({
      studentFeeId: parseInt(studentFeeId),
      title,
      description
    });

    res.json({
      success: true,
      message: "Payment link created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};


const chargeMobileMoney = async (req, res, next) => {
  try {
    const { studentFeeId, email, phoneNumber, amount } = req.body;

    const result = await paymentsService.chargeMobileMoneyPayment({
      studentFeeId: studentFeeId ? parseInt(studentFeeId) : null,
      email,
      phoneNumber,
      amount: amount ? parseFloat(amount) : null
    });

    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  
  createFeeStructure,
  getFeeStructuresByYear,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
  
  
  assignFeeToStudent,
  assignFeeToClass,
  getStudentFees,
  getClassFees,
  updateStudentFee,
  
  
  createPayment,
  completePayment,
  getPaymentById,
  getPaymentsByStudent,
  handlePaymentCallback,
  
  
  getFeeCollectionReport,
  createReconciliation,
  getReconciliations,
  
  
  initializePaystackPayment,
  verifyPaystackPayment,
  handlePaystackWebhook,
  createPaystackPaymentLink,
  chargeMobileMoney,
};

