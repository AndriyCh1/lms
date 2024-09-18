import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { list }: { list: { id: number; position: number }[] } =
      await req.json();

    const ownCourse = await db.course.findUnique({
      where: {
        id: +params.courseId,
        userId: userId,
      },
    });

    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const results = await Promise.allSettled(
      list.map((item) =>
        db.chapter.update({
          where: { id: item.id },
          data: { position: item.position },
        })
      )
    );

    if (results.some((result) => result.status === "rejected")) {
      return new NextResponse("Internal Error", { status: 500 });
    }

    return new NextResponse("Success", { status: 200 });
  } catch (error) {
    console.log("[REORDER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
