import {Request, Response, NextFunction } from "express";
import { verifyAccessToken, UserPayload} from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
    user?: UserPayload;
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction){
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if(!token){
        return res.status(401).json({message: "Access token is missing"});
    }

    const decoded = verifyAccessToken(token);
    if(!decoded){
        return res.status(403).json({error: "Invalid or expired access token"});
    }

    req.user = decoded;
    next();
}
