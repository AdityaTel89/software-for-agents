import {Router, Response} from "express";
import bcrypt from "bcryptjs";
import { db } from "../config/db";

import {AuthenticatedRequest, authenticateJWT} from "../middleware/auth";

import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie, removeRefreshTokenCookie, verifyRefreshToken } from "../utils/jwt";

const router: Router = Router();

router.post("/signup", async (req, res) =>{
    try {
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({error: "Email and password are required"});
        }
    
    const existingUser = await db.user.findUnique({where: {email}});
    if(existingUser){
        return res.status(400).json({error: "User already exists"});
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await db.user.create({
        data: {email, passwordHash},
    });

    const payload = {userId: user.id, email: user.email};
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await db.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    setRefreshTokenCookie(res, refreshToken);
    return res.status(201).json({
        accessToken,
        user: {id: user.id, email: user.email},
    });
} catch (error){
    return res.status(500).json({error: "Internal server error"});

}
});

router.post("/login", async(req,res) => {
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({error: "Email and password required"});
        }

        const user = await db.user.findUnique({where: {email}});
        if(!user || !(await bcrypt.compare(password, user.passwordHash))){
            return res.status(401).json({error: "Invalid credentials"});
        }

        const payload = {userId: user.id, email: user.email};
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await db.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        })

        setRefreshTokenCookie(res, refreshToken);
        return res.json({
            accessToken,
            user: {id: user.id, email: user.email},
        });

    } catch(error){
        return res.status(500).json({error: "Internal server error"});
    }
});

router.post("/refresh", async(req, res) => {
    try{
        const oldToken = req.cookies.refresh_token;
        if(!oldToken){
            return res.status(401).json({error: "Refresh token required"});
        }
        
        const decoded = verifyRefreshToken(oldToken);
        if(!decoded){
            removeRefreshTokenCookie(res);
            return res.status(401).json({ error : "Invalid refresh token"});
        }

        const tokenRecord = await db.refreshToken.findUnique({where: {
            token: oldToken
        }});

        if(!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
            if(tokenRecord){
                await db.refreshToken.updateMany({
                    where: {userId: tokenRecord.userId},
                    data: {isRevoked: true},
                });
            }
            removeRefreshTokenCookie(res);
            return res.status(401).json({error: "Breach detected or token expired. Please log in again"});
        }
        await db.refreshToken.update({
            where: {id: tokenRecord.id},
            data: {isRevoked: true},
        });

        const payload = {userId: decoded.userId, email: decoded.email};

        const newAccessToken = generateAccessToken(payload);
        const newRefreshToken = generateRefreshToken(payload);

        await db.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: decoded.userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),

            },
        });

        setRefreshTokenCookie(res, newRefreshToken);
        return res.json({accessToken: newAccessToken});
    } catch(error){
        return res.status(500).json({error: "Internal server error"});
    }
});

router.post("/logout", async(req,res) => {
    try{
        const token = req.cookies.refresh_token;
        if(token){
            await db.refreshToken.updateMany({
                where: {token},
                data: {isRevoked: true},
            })
        }
        removeRefreshTokenCookie(res);
        return res.json({message: "Logged out successfully"});
    } catch(error){
        return res.status(500).json({error: "Internal server error"});
    }
});

router.get("/protected", authenticateJWT,(req: AuthenticatedRequest, res) => {
    return res.json({message: "Access granted to protected endpoint", user: req.user});
});

export default router;