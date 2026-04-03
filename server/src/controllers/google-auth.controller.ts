import { Request, Response } from "express";
import { getUserInfo } from "../services/google-auth.service";
import { UserService } from "../services/user.service";
import { JwtService } from "../services/ui/jwt.service";

const userService = new UserService();
const jwtService = new JwtService();

export const signinWithGoogle = async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken)
      return res.status(400).json({ status: 400, error: "Bad request" });
    const userInfo = await getUserInfo(accessToken);
    if (!userInfo) {
      return res.status(401).json({ error: "Invalid access token" });
    }

    const user = await userService.findOrCreateUserByEmail(userInfo.email);
    const token = jwtService.sign({
      userId: user.id,
      phoneNumber: user.phoneNumber ?? "",
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        hasUsedFreeTrial: user.hasUsedFreeTrial,
      },
    });
  } catch (error) {
    console.error("error", error);
  }
};
