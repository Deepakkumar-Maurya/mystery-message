import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { Message } from "@/model/User";
import { messageSchema } from "@/schema/messageSchema";

export async function POST(request: Request) {
    await dbConnect();

    try {
        const { username, content } = await request.json();
        const result = messageSchema.safeParse({ content });
        if (!result.success) {
            const messageErrors = result.error.format().content?._errors || [];
            return Response.json(
                {
                    success: false,
                    message: messageErrors.length > 0 ? messageErrors.join(", ") : "Invalid body params",
                },
                {
                    status: 400,
                }
            )
        }

        const user = await UserModel.findOne({ username });
        if (!user) {
            return Response.json(
                {
                    success: false,
                    message: "User not found",
                },
                {
                    status: 404,
                }
            )
        }

        //* Check if user is accepting messages
        if (!user.isAcceptingMessage) {
            return Response.json(
                {
                    success: false,
                    message: "User is not accepting messages",
                },
                {
                    status: 403,
                }
            )
        }

        const newMessage = { content, createdAt: new Date() };
        user.messages.push(newMessage as Message);
        await user.save();

        return Response.json(
            {
                success: true,
                message: "Message sent successfully",
            },
            {
                status: 200,
            }
        )
    } catch (error) {
        console.log("Error in send-message", error);
        return Response.json(
            {
                success: false,
                message: "Error in send-message",
            },
            {
                status: 500,
            }
        )
    }
}