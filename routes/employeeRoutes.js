const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Assignment = require("../models/Assignment");
const Employee = require("../models/Employee");
const TransactionHistory = require("../models/TransactionHistory");
const Lead = require("../models/Lead");
const config = require("../config/config");
const Data=require("../models/Data");
const Form=require("../models/Form");

// Login route
router.post("/form", async (req, res) => {
  try {
    const form = new Form(req.body);
    await form.save();
    res.status(201).json({ message: "Form created successfully", form });
  } catch (error) {
    res.status(400).json({ message: "Failed to create form", error });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminFound = await Employee.findOne({ email });
    if (adminFound) {
      return res.status(400).json({ error: "Employee already exists" });
    }

    const employee = new Employee({ email, password, ...req.body });
    await employee.save();
    res.status(201).json({
      success: true,
      data: {
        employee,
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

    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (employee.password !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }
    if (
      employee.account_status === "rejected" ||
      employee.account_status === "pending"
    ) {
      return res.status(402).json({
        success: false,
        message:
          "Your account is rejected or pending. Please contact the admin.",
      });
    }

    const token = jwt.sign({ employeeId: employee._id }, config.secret, {
      expiresIn: "1h",
    });

    res.status(200).json({
      success: true,
      data: {
        employee,
        token,
      },
      message: "Sign-in successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to authenticate",
    });
  }
});

//get logged in employee detail
router.get("/detail", async (req, res) => {
  const { employee_id } = req.query; // Extract the employee ID from the query parameter

  try {
    const employee = await Employee.findById(employee_id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // let accessibleBalance = 0; // Initialize accessibleBalance

    // Calculate the accessibleBalance by summing up the amounts from referred agents only
    // if (employee.referred_agent_id && employee.referred_agent_id.length > 0) {
    //   // If there are referred agents, calculate the sum of their amounts
    //   const referredAgentAmounts = employee.referred_agent_id.map(
    //     (agent) => agent.amount
    //   );
    //   accessibleBalance = referredAgentAmounts.reduce(
    //     (acc, amount) => acc + amount,
    //     0
    //   );
    // }

    // Send the employee details with the calculated accessibleBalance in the response
    res.status(200).json({
      success: true,
      data: {
        name:employee.name,
        balance: employee.balance,
        accessibleBalance: employee.accessibleBalance,
        referred_agent_id: employee.referred_agent_id,
      },
    });
    // console.log(accessibleBalance);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee details",
    });
  }
});

//get logged in employee detail
router.get("/getLeadByEmployee", async (req, res) => {
  const { id } = req.query; // Extract the employee ID from the query parameter

  try {
    const employee = await Lead.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // If employee found, send the employee details in the response
    res.status(200).json({
      success: true,
      data: {
        balance: employee.balance,
        accessibleBalance: employee.accessibleBalance,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee details",
    });
  }
});

// get all Assignment added by admin
router.get("/assignments", async (req, res) => {
  try {
    const assignments = await Assignment.find();

    if (!assignments || assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No assignments found created by admin",
      });
    }

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: {
        assignments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch assignments created by admin",
    });
  }
});

// add lead
router.post("/lead", async (req, res) => {
  try {
    const { company_name, name, mob_no, employee_id, referred_agent_id, date } =
      req.body;
    const lead = await Lead.create({
      company_name,
      name,
      mob_no,
      employee_id,
      referred_agent_id,
      date,
    });

    const employee = await Employee.findById(employee_id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    //for deposite of balance due to lead
    employee.balance += 0;
    const agentExists = employee.referred_agent_id.some(
      (agent) => agent.id === referred_agent_id
    );

    // If the agent doesn't exist, add it to the array
    if (!agentExists) {
      employee.referred_agent_id.push({ id: referred_agent_id, amount: 0 });
    }
    await employee.save();

    res.status(201).json({
      success: true,
      data: {
        lead,
      },
      message: "Lead added successfully",
    });
  } catch (error) {
    console.log(error, "rr");
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get added leads of loggedIn employee
router.get("/leads", async (req, res) => {
  try {
    const { employee_id } = req.query; // Accessing employee_id from query parameters

    const leads = await Lead.find({ employee_id });

    if (!leads || leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No leads found",
      });
    }

    res.status(200).json({
      success: true,
      count: leads.length,
      data: {
        leads,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
    });
  }
});

//Get all leads
router.get("/getallLeads", async (req, res) => {
  try {
    const leads = await Lead.find();

    if (!leads || leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No leads found",
      });
    }

    res.status(200).json({
      success: true,
      count: leads.length,
      data: {
        leads,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
    });
  }
});

//create-referred-agent data to employee array
router.post("/create-referred-agent", async (req, res) => {
  try {
    const employee_id = req.body.employee_id;
    const agent_id = String(req.body.agent_id);

    const updatedDocument = await Employee.findOneAndUpdate(
      { _id: employee_id },
      { $push: { referred_agent_id: { id: agent_id, amount: 0 } } },
      { new: true, upsert: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({
        success: false,
        message: "Not Updated!",
      });
    }

    res.status(200).json({
      success: true,
      message: "Created!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create referred agent id!",
    });
  }
});

// Create employee
router.post("/employee", async (req, res) => {
  try {
    const {
      email,
      name,
      phoneNo,
      password,
      agent_code,
      accountNo,
      ifsc,
      upiId,
    } = req.body;

    // Check if the email is already registered
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res
        .status(409)
        .json({ success: false, message: "Email is already registered" });
    }

    // Create a new employee
    const employee = new Employee({
      email,
      password,
      name,
      mob_no: phoneNo,
      agent_code,
      account_no: accountNo,
      ifsc_code: ifsc,
      upi_id: upiId,
    });

    await employee.save();

    res.status(201).json({
      success: true,
      data: {
        employee,
      },
      message: "Employee registered successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to register employee",
    });
  }
});

router.get("/getAllReferredCode", async (req, res) => {
  try {
    // Use the find method to retrieve all documents and only the referred_agent_id field
    const result = await Employee.find({}, "referred_agent_id");

    // Extract the referred_agent_id values from the result
    const allReferredCodes = result
      .map((employee) => employee.referred_agent_id)
      .flat();

    res.json({ success: true, data: { allReferredCodes } });
  } catch (error) {
    console.error("Error fetching referred_agent_id:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.get("/getEmployeeReferredCode/:employeeId", async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const result = await Employee.findOne(
      { _id: employeeId },
      "referred_agent_id"
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const allReferredCodes = result.referred_agent_id || [];

    res.json({ success: true, data: { allReferredCodes } });
  } catch (error) {
    console.error("Error fetching referred_agent_id:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.get("/dashboard/:employeeId", async (req, res) => {
  try {
    const id = req.params.employeeId;
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyEarnings = await TransactionHistory.aggregate([
      {
        $match: {
          employee_id: id, // Change this line
          date: { $gte: today },
          status: "accepted",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Calculate weekly earnings
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const weeklyEarnings = await TransactionHistory.aggregate([
      {
        $match: {
          employee_id: id, // Change this line
          date: { $gte: oneWeekAgo },
          status: "accepted",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // If employee found, send the employee details in the response
    res.status(200).json({
      success: true,
      data: {
        balance: employee.balance,
        accessibleBalance: employee.accessibleBalance,
        dailyEarnings: dailyEarnings.length > 0 ? dailyEarnings[0].total : 0,
        weeklyEarnings: weeklyEarnings.length > 0 ? weeklyEarnings[0].total : 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee details",
    });
  }
});

router.post("/data", async (req, res) => {
  try {
    const { userId } = req.query;
    const employee=await Employee.findById(userId);

    const existingData = await Data.findOne({ userId,flag:false });
    if (existingData) {
      return res
        .status(201)
        .json({ success: true, data:existingData });
    }

    const data = await Data.findOneAndUpdate(
      { flag: false, userId: null },
      { userId:userId,agentCode:employee?.agent_code },
      { new: true }
    );

    if (!data) {
      return res
        .status(404)
        .json({ success: false, error: "No available data found" });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/flag', async (req, res) => {
  try {
    const { dataId} = req.query;
    const data = await Data.findByIdAndUpdate(dataId, { flag:true }, { new: true });

    if (!data) {
      return res.status(404).json({ success: false, error: "Data not found" });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});





module.exports = router;
