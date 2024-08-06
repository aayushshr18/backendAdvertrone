const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Assignment = require("../models/Assignment");
const Lead = require("../models/Lead");
const Notice = require("../models/Notice");
const Employee = require("../models/Employee");
const config = require("../config/config");
const TransactionHistory = require("../models/TransactionHistory");
const Data = require("../models/Data");
const TeamLeader = require("../models/TeamLeader");

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminFound = await Admin.findOne({ email });
    if (adminFound) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    const admin = new Admin({ email, password });
    await admin.save();

    const token = jwt.sign({ adminId: admin._id }, config.secret, {
      expiresIn: "1h",
    });

    res.status(201).json({
      success: true,
      data: {
        admin,
        token,
      },
      message: "Signup successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create user or token",
    });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ adminId: admin._id }, config.secret, {
      expiresIn: "1h",
    });

    res.status(200).json({
      success: true,
      data: {
        admin,
        token,
      },
      message: "Sign-in successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to generate user or token",
    });
  }
});

// Add assignment route
router.post("/assignment", async (req, res) => {
  try {
    const { company_name, company_link } = req.body;
    const assignment = new Assignment({ company_name, company_link });
    await assignment.save();

    res.status(201).json({
      success: true,
      data: {
        assignment,
      },
      message: "Assignment added successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to add assignment",
    });
  }
});

// Get all assignments route
router.get("/assignments", async (req, res) => {
  try {
    const assignments = await Assignment.find();
    if (!assignments || assignments.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No assignments found" });
    }
    res.status(200).json({
      success: true,
      count: assignments.length,
      data: {
        assignments,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assignments",
    });
  }
});

// Get all leads route
router.get("/leads", async (req, res) => {
  try {
    const result = await Lead.aggregate([
      {
        $lookup: {
          from: "employees",
          localField: "employee_id",
          foreignField: "_id",
          as: "employee_agent",
        },
      },
      // Optionally, you can add more stages to shape the output as needed
      {
        $unwind: "$employee_agent",
      },
    ]);

    if (!result || result.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Leads not found" });
    }
    res.status(200).json({
      success: true,
      count: result.length,
      data: {
        result,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error in getting the leads",
    });
  }
});

// Update lead status by ID
router.put("/lead/:_id", async (req, res) => {
  try {
    const { status, employee_id } = req.body;
    const { _id } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }

    const lead = await Lead.findByIdAndUpdate(_id, { status }, { new: true });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    //  if (lead.status === "accepted") {
    //   const employee = await Employee.findById(employee_id);

    //   if (!employee) {
    //     return res.status(404).json({
    //       success: false,
    //       message: "Employee not found",
    //     });
    //   }

    //   //for deposite of balance due to accepted lead
    //   employee.accessibleBalance += 500;
    //   await employee.save();
    // }

    res.status(200).json({
      success: true,
      data: {
        lead,
      },
      message: "Lead status updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update lead status",
    });
  }
});

router.put("/add-amount", async (req, res) => {
  const { amount, employee_id, agent_id } = req.body;
  try {
    const employee = await Employee.findOne({ _id: employee_id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    let newBalanceValue = employee.balance + Number(amount);

    const updatedEmployee = await Employee.findOneAndUpdate(
      {
        _id: employee_id,
        "referred_agent_id?.id": agent_id,
      },
      {
        $set: {
          "referred_agent_id.$.amount": Number(amount),
          balance: newBalanceValue,
          accessibleBalance: newBalanceValue,
        },
      },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee or Agent not found",
      });
    }

    res.status(201).json({
      success: true,
      message: "Balance Added!",
      data: {
        employee: updatedEmployee,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update lead status",
    });
  }
});

//add notice
router.post("/notice", async (req, res) => {
  try {
    const { notice } = req.body;
    const newNotice = await Notice.create({ notice });
    res.status(201).json({
      success: true,
      message: "Notice added successfully",
      data: {
        notice: newNotice,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add notice",
      error: error.message,
    });
  }
});

// delete notice by id
router.delete("/notice/:noticeId", async (req, res) => {
  try {
    const { noticeId } = req.params; // Extract 'noticeId' from the request parameters
    const deletedNotice = await Notice.findByIdAndDelete(noticeId); // Find and delete the notice by ID
    if (!deletedNotice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Notice deleted successfully",
      data: {
        notice: deletedNotice,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete notice",
      error: error.message,
    });
  }
});

//get all notice
router.get("/notices", async (req, res) => {
  try {
    const notices = await Notice.find(); // Retrieve all notices from the database
    res.status(200).json({
      success: true,
      count: notices.length,
      data: {
        notices,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notices",
      error: error.message,
    });
  }
});

//routes to register employee

// Function to generate a random 6-digit password
const generateRandomPassword = () => {
  const password = Math.floor(100000 + Math.random() * 900000).toString();
  return password;
};

// Create employee
router.post("/employee", async (req, res) => {
  try {
    const {
      email,
      name,
      mob_no,
      account_no,
      ifsc_code,
      upi_id,
      account_status,
      agent_code,
    } = req.body;

    // Generate a random 6-digit password
    const password = generateRandomPassword();

    const employee = new Employee({
      email,
      password,
      name,
      mob_no,
      account_no,
      ifsc_code,
      upi_id,
      account_status,
      agent_code,
    });

    await employee.save();

    res.status(201).json({
      success: true,
      data: {
        employee,
      },
      message: "Employee added successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to add employee",
    });
  }
});

// Add Amt to employee by ID
router.put("/addamt/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const { amount, agent_id } = req.body;

    // First, check if the employee exists
    const employee = await Employee.findById(_id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Find the index of the agent_id in the referred_agent_id array
    const index = employee.referred_agent_id.findIndex(
      (agent) => agent.id === agent_id
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Agent not found in the referred_agent_id array",
      });
    }

    // Update the amount in the indexed object
    employee.referred_agent_id[index].amount = parseInt(amount);
    const balance =
      (employee.balance ? parseInt(employee.balance) : 0) + parseInt(amount);
    const accessibleBalance =
      (employee.accessibleBalance ? parseInt(employee.accessibleBalance) : 0) +
      parseInt(amount);

    // Now, update the employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      _id,
      {
        balance,
        accessibleBalance,
        referred_agent_id: employee.referred_agent_id,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        updatedEmployee,
      },
      message: "Amount Added successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to Add Amount",
    });
  }
});

router.put("/employee/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const updateData = req.body;

    const employee = await Employee.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        employee,
      },
      message: "Employee updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update employee",
    });
  }
});

// Delete employee by ID
router.delete("/assignment/:_id", async (req, res) => {
  console.log("cll here");
  try {
    const { _id } = req.params;

    const assignment = await Assignment.findByIdAndDelete(_id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete Assignment",
    });
  }
});

//Delete company by ID
router.delete("/employee/:_id", async (req, res) => {
  try {
    const { _id } = req.params;

    const employee = await Employee.findByIdAndDelete(_id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete employee",
    });
  }
});
// Get all registered employees
router.get("/employees", async (req, res) => {
  try {
    const employees = await Employee.find();

    if (!employees || employees.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No employees found",
      });
    }

    res.status(200).json({
      success: true,
      count: employees.length,
      data: {
        employees,
      },
      message: "Employees fetched successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
});

//Amount Access Passcode
router.post("/amtaccesspasscode", async (req, res) => {
  try {
    const passcode = "7985744915";
    const { pin } = req.body;
    if (pin === passcode) {
      return res.json({
        success: true,
      });
    }
    res.json({
      success: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Wrong Password",
    });
  }
});

router.post("/addAmtTeamlead", async (req, res) => {
  try {
    const { email, amt } = req.query;
    const tl = await TeamLeader.findOne({ email: email });
    tl.totalBalance += parseInt(amt);
    tl.currBalance += parseInt(amt);
    await tl.save();

    res.json({
      success: true,
      tl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Wrong Password",
    });
  }
});

router.patch("/addAmtTeamlead", async (req, res) => {
  try {
    const { email, amt } = req.query;
    const tl = await TeamLeader.findOne({email:email});
    tl.totalBalance += parseInt(amt);
    tl.currBalance += parseInt(amt);
    await tl.save();

    res.json({
      success: true,
      tl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Wrong Password",
    });
  }
});

//Get Admin Dashboard data
router.get("/dashboard", async (req, res) => {
  try {
    const employees = await Employee.find();

    if (!employees) {
      return res.status(404).json({
        success: false,
        message: "No employees found",
      });
    }
    let totalUsers = employees.length;

    const transactionHistory = await TransactionHistory.find({
      status: { $ne: "accepted" },
    });
    if (!transactionHistory) {
      return res.status(404).json({
        success: false,
        message: "No pending transaction history found",
      });
    }
    let newWithdrawRequest = transactionHistory.length;

    const leads = await Lead.find();
    if (!leads) {
      return res.status(404).json({
        success: false,
        message: "No registration requests found",
      });
    }
    let totalRegistrationRequest = leads.length;

    const leadsForUpdate = await Lead.find({ status: { $ne: "accepted" } });
    if (!leadsForUpdate) {
      return res.status(404).json({
        success: false,
        message: "No pending leads for update found",
      });
    }
    let totalLeadsForUpdate = leadsForUpdate.length;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        newWithdrawRequest,
        totalRegistrationRequest,
        totalLeadsForUpdate,
      },
      message: "Dashboard statistics fetched successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
});

//bulkData Adding
router.post("/bulk-data", async (req, res) => {
  try {
    const dataArray = req.body;
    const result = await Data.insertMany(dataArray);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

//bulkData get
router.get("/bulk-data", async (req, res) => {
  try {
    const result = await Data.find();
    res.status(201).json({ success: true, data: result?.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/delall", async (req, res) => {
  try {
    await Data.deleteMany({});
    res
      .status(200)
      .json({ success: true, message: "All data records have been deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
