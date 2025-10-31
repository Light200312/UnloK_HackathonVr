import express from "express";
import {
  createClan,
  inviteToClan,
  acceptClanInvite,
  acceptClanJoinRequest,
  rejectClanJoinRequest,
  leaveClan,
  kickClanMember,
  updateClanRole,
  getClanMessages,
  sendClanMessage,
  searchClans,
  getClanInfo,
  requestJoinClan,getClanRequests 
} from "../controllers/clanController.js";

const router = express.Router();

/* 🏰 Clan Management */
router.post("/create", createClan);          // Create new clan
router.post("/invite", inviteToClan);        // Invite a user to clan
router.post("/acceptInvite", acceptClanInvite); // Accept an invite (from leader)
router.post("/leave", leaveClan);            // Leave current clan
router.post("/kick", kickClanMember);        // Kick a member
router.post("/updateRole", updateClanRole);  // Promote/demote roles

/* 🧭 Clan Join Requests */
router.post("/requestJoin", requestJoinClan);        // Send join request to leader
router.post("/acceptJoin", acceptClanJoinRequest);   // Leader accepts join request
router.post("/rejectJoin", rejectClanJoinRequest);   // Leader rejects join request

/* 🧭 Clan Discovery */
router.post("/search", searchClans);                 // Search clans by name or ID
router.get("/info/:clanId", getClanInfo);            // Get detailed clan info
router.post("/requests", getClanRequests); 
/* 💬 Clan Chat */
router.get("/chat/:chatRoomId", getClanMessages);    // Fetch messages
router.post("/chat/:chatRoomId", sendClanMessage);   // Send a new message

export default router;
