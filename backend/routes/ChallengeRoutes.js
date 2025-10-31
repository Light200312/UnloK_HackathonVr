import express from "express"
const router = express.Router();
import {generateAichallenge,fetchChallenges,CalculateRankOfUser,updateScoreOnChallengeComplete,deleteChallenge} from "../controllers/ChallengeControlers.js"

router.post("/create-challenges",generateAichallenge)
//todo create generateAichellenge (type of chellenge->daily,weekly,monthly, credits) and link to user

router.get("/get-challenges/:userId/:challengeType",fetchChallenges)
//todo  create fetchChellenges to send prev made chellenge to user

router.put("/update-score",updateScoreOnChallengeComplete)

router.get("/get-rank/:userId",CalculateRankOfUser)

router.delete("/delete/:challengeId", deleteChallenge);
//todo calc user rank and update it(its user atribute) based on points in sub matrices,F7_E6_D5_C4_B3_A2_S1(coresspondingly-> Sleeper,Awakened,Master,Saint,Sovereign,Spirit,God) or (Beast,Monster,Demon,Devil,Tyrant,Terror,Terror,Titan) user can choose the routes he want to ascend
export default router