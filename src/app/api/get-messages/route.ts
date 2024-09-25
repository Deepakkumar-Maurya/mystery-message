import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { User } from "next-auth";

export async function GET() {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const user: User = session?.user;

    if (!session || !session.user) {
        return Response.json(
            {
                success: false,
                message: "user Unauthorized",
            },
            {
                status: 401,
            }
        );
    }

    const userId = user._id;

    try {
        const dbUser = await UserModel.aggregate([
            { $match: { _id: userId } },
            { $unwind: "$messages" },
            { $sort: { "messages.createdAt": -1 } },
            { $group: { _id: "$_id", messages: { $push: "$messages" } } },
        ]);
        console.log(dbUser);

        if (!dbUser || dbUser.length === 0) {
            return Response.json(
                {
                    success: false,
                    message: "No messages found",
                },
                { status: 404 }
            );
        }

        return Response.json(
            {
                success: true,
                messages: dbUser[0].messages,
            },
            { status: 200 }
        );
    } catch (error) {
        console.log(error);
        return Response.json(
            {
                success: false,
                message: "error fetching messages",
            },
            {
                status: 500,
            }
        );
    }
}
