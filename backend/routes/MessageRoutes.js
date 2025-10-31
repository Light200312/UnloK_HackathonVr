import express from "express"
import {getMessages ,getFriendsForSidebar ,getUsersForSidebar,sendMessage,getGlobalMessage,sendGlobalMessage} from "../controllers/message.controller.js"
const router =express.Router()

router.get("/users/:id",getUsersForSidebar);
router.post("/get/:id",getMessages);
router.post("/send/:id",sendMessage);
router.get("/friends/:id", getFriendsForSidebar);
router.get("/globalMessage",getGlobalMessage)
router.post("/globalMessage",sendGlobalMessage)

export default router;