const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");
const Employee = require("../models/Employee");
const TransactionHistory = require("../models/TransactionHistory");
const TeamLeader = require("../models/TeamLeader");
const Leads = require("../models/Lead");
const Req = require("../models/Request");

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const { email } = req.body;

    const found = await TeamLeader.findOne({ email });
    if (found) {
      return res.status(400).json({ error: "Team Leader already exists" });
    }

    const tl = new TeamLeader(req.body);
    await tl.save();

    res.status(201).json({
      success: true,
      data: {
        teamLeader: tl,
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

    const tl = await TeamLeader.findOne({ email });
    if (!tl) {
      return res.status(404).json({ error: "Team Leader not found" });
    }

    if (password !== tl.password) {
      return res.status(401).json({ error: "Invalid password" });
    }

    res.status(200).json({
      success: true,
      data: {
        teamLeader: tl,
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

router.post("/withdraw", async (req, res) => {
  try {
    const { id, amt } = req.query;
    const tl = await TeamLeader.findById(id);
    if (!tl) {
      return res.status(404).json({ error: "Team Leader not found" });
    }
    if (amt > tl.currBalance) {
      return res.status(404).json({ error: "Insufficient fund" });
    }
    const t = await Req.findOne({ userId:id, status: "pending" });
    if (t) {
      return res
        .status(404)
        .json({ error: "Only one req is allowed at a time" });
    }
    const r = new Req({
      name: tl.name,
      email: tl.email,
      userId: tl._id,
      amt: amt,
    });
    const s = await r.save();
    res.status(200).json({
      success: true,
      req: s,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to generate user or token",
    });
  }
});

router.get("/requests", async (req, res) => {
  try {
    const tl = await Req.find();
    res.status(200).json({
      success: true,
      req: tl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to generate user or token",
    });
  }
});

router.patch("/request", async (req, res) => {
  try {
    const {status,id}=req.query;
    const tl = await Req.findById(id);
    tl.status=status;
    await tl.save();

    res.status(200).json({
      success: true,
      req: tl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to generate user or token",
    });
  }
});

// Get all Agents route
router.get("/agents", async (req, res) => {
  try {
    const { id } = req.query;
    const teamLeader = await TeamLeader.findById(id);
    if (!teamLeader) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const members = await Promise.all(
      teamLeader.agent_id?.map(async (id) => {
        const user = await Employee.findOne({ agent_code: id }).select(
          "-password"
        );
        return user;
      })
    );

    res.status(200).json({
      success: true,
      count: members.length,
      members: members,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error in getting the leads",
    });
  }
});

// Get all Leads route
router.get("/leads", async (req, res) => {
  try {
    const { id } = req.query;
    const teamLeader = await TeamLeader.findById(id);

    if (!teamLeader) {
      return res.status(404).json({
        success: false,
        message: "Team leader not found",
      });
    }

    let leads = [];

    await Promise.all(
      teamLeader.agent_id.map(async (agentId) => {
        const user = await Employee.findOne({ agent_code: agentId }).select(
          "-password"
        );
        if (user) {
          const userLeads = await Promise.all(
            user.referred_agent_id.map(async (a) => {
              const lead = await Leads.find({ referred_agent_id: a.id });
              return lead.map((l) => ({
                ...l.toObject(),
                referBy: user.agent_code,
              }));
            })
          );
          leads = leads.concat(userLeads.flat());
        }
      })
    );

    res.status(200).json(leads);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error in getting the leads",
    });
  }
});

// Add Remove Agent
router.patch("/remagent", async (req, res) => {
  try {
    const { agentCode, id } = req.query;
    const teamLeader = await TeamLeader.findById(id);

    if (teamLeader.agent_id.includes(agentCode)) {
      teamLeader.agent_id = teamLeader.agent_id?.filter(
        (id) => id === agentCode
      );
    }
    await teamLeader.save();
    res
      .status(200)
      .json({ success: true, message: "Agent ID updated", teamLeader });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update lead status",
    });
  }
});

router.patch("/addagent", async (req, res) => {
  try {
    const { agentCode, id } = req.query;
    const teamLeader = await TeamLeader.findById(id);
    const emp = await Employee.findOne({ agent_code: agentCode });

    if (!emp) {
      return res
        .status(404)
        .json({ success: false, message: "Agent not found" });
    }

    if (!teamLeader.agent_id.includes(agentCode)) {
      teamLeader.agent_id.push(agentCode);
    }
    await teamLeader.save();
    res
      .status(200)
      .json({ success: true, message: "Agent ID updated", teamLeader });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update lead status",
    });
  }
});

// Get all registered employees
router.get("/all", async (req, res) => {
  try {
    const leaders = await TeamLeader.find();

    if (!leaders || leaders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No leaders found",
      });
    }

    res.status(200).json({
      success: true,
      count: leaders.length,
      data: {
        leaders,
      },
      message: "Leaders fetched successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
});

//Get Admin Dashboard data
router.get("/dashboard", async (req, res) => {
  try {
    const { id } = req.query;
    const teamLeader = await TeamLeader.findById(id);

    let tleads = 0;
    let amt = 0;
    const members = await Promise.all(
      teamLeader.agent_id.map(async (id) => {
        const user = await Employee.findOne({ agent_code: id }).select(
          "-password"
        );
        amt = amt + (user?.balance || 0);
        const leads = await Leads.find({ employee_id: user?._id });
        tleads = tleads + (leads?.length || 0);
        return user;
      })
    );

    res.status(200).json({
      success: true,
      user: teamLeader,
      data: {
        totalTeam: teamLeader.agent_id.length,
        totalLeads: tleads,
        amount: amt,
        weekly: amt,
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

module.exports = router;
