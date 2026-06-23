import jwt from "jsonwebtoken";
import { Response }  from "express";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access-secret-key";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret-key";

export interface UserPayload  {
    userId: string;
    email: string;
}

export function generateAccessToken(payload: UserPayload ): string {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: UserPayload): string {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): UserPayload | null {
    try {
        return jwt.verify(token, ACCESS_SECRET) as UserPayload;
    } catch {
        return null;
    }
}

export function verifyRefreshToken(token: string): UserPayload | null {
    try{
        return jwt.verify(token, REFRESH_SECRET) as UserPayload;
    } catch {
        return null;
    }
}

export function setRefreshTokenCookie(res: Response, token: string){
    res.cookie("refreshToken", token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
    });
}

export function removeRefreshTokenCookie(res: Response){
    res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
    });
}