import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import type { Connection } from "mongoose";
import { Types } from "mongoose";
import { CreateUserDto } from "./dto/create-user.dto";
import { AddSessionDto } from "./dto/add-session.dto";
import { AddQADto } from "./dto/add-qa.dto";
import { DeleteSessionDto } from "./dto/delete-session.dto";
import { DeleteUserDto } from "./dto/delete-user.dto";

const ROLE_CONFIG = {
  student: {
    array: "student",
    idField: "student_id",
    doc: "68d7e0b04f788da2cf74e392"
  },
  faculty: {
    array: "faculty",
    idField: "faculty_id",
    doc: "68d7e9464f788da2cf74e397"
  },
  scholar: {
    array: "scholar",
    idField: "scholar_id",
    doc: "68d7e9614f788da2cf74e399"
  },
  official: {
    array: "official",
    idField: "official_id",
    doc: "68d7e9764f788da2cf74e39b"
  }
};

@Injectable()
export class ChatbotService {
  constructor(
    @InjectConnection("university") private universityConnection: Connection
  ) {}

  async addUser(dto: CreateUserDto) {
    const config = ROLE_CONFIG[dto.role];
    const docId = new Types.ObjectId(config.doc);
    const userObj: any = {
      [config.idField]: dto.id,
      name: dto.name,
      sessions: []
    };
    console.log("Creating user:", userObj, "in doc:", docId.toString());
    await this.universityConnection.collection("memory").updateOne(
      { _id: docId },
      { $push: { [config.array]: userObj } as any }
    );
    return { success: true };
  }

  async addSession(dto: AddSessionDto) {
    const config = ROLE_CONFIG[dto.role];
    const docId = new Types.ObjectId(config.doc);

    const doc = await this.universityConnection
      .collection("memory")
      .findOne({ _id: docId });
    if (!doc) return { error: "Document not found" };

    const userArr = doc[config.array] || [];
    const user = userArr.find((u: any) => u[config.idField] === dto.id);
    const nextSessionId =
      user && user.sessions ? String(user.sessions.length + 1) : "1";

    await this.universityConnection.collection("memory").updateOne(
      { _id: docId },
      {
        $push: {
          [`${config.array}.$[user].sessions`]: {
            session_id: nextSessionId,
            session_name: dto.session_name,
            qa: [] as {
              question: string;
              answer: string;
              timestamp: string;
            }[]
          }
        } as any
      },
      {
        arrayFilters: [{ [`user.${config.idField}`]: dto.id }]
      }
    );

    return { session_id: nextSessionId };
  }

async addQA(dto: AddQADto) {
  const config = ROLE_CONFIG[dto.role];
  const docId = new Types.ObjectId(config.doc);

  // 🔍 Debug logs
  console.log("addQA dto:", dto);
  console.log("Using docId:", docId.toString());
  console.log("ArrayFilters:", [
    { [`stud.${config.idField}`]: dto.id },
    { "sess.session_id": dto.session_id }
  ]);

  // 1. Try to push into existing session
  const result = await this.universityConnection.collection("memory").updateOne(
    { _id: docId },
    {
      $push: {
        [`${config.array}.$[stud].sessions.$[sess].qa`]: {
          question: dto.question,
          answer: dto.answer,
          timestamp: dto.timestamp
        }
      } as any
    },
    {
      arrayFilters: [
        { [`stud.${config.idField}`]: dto.id },
        { "sess.session_id": dto.session_id }
      ]
    }
  );

  // 🔍 Debug result
  console.log("UpdateOne result:", result);

  // 2. If no session found, create it
  if (result.modifiedCount === 0) {
    await this.universityConnection.collection("memory").updateOne(
      { _id: docId, [`${config.array}.${config.idField}`]: dto.id },
      {
        $push: {
          [`${config.array}.$.sessions`]: {
            session_id: dto.session_id,
            session_name: `Session ${dto.session_id}`,
            qa: [
              {
                question: dto.question,
                answer: dto.answer,
                timestamp: dto.timestamp
              }
            ]
          }
        } as any
      }
    );
  }

  return { success: true };
}

  async deleteSession(dto: DeleteSessionDto) {
  const config = ROLE_CONFIG[dto.role];
  const docId = new Types.ObjectId(config.doc);

  // Use positional $ operator to target the user, then $pull session by session_id
  await this.universityConnection.collection("memory").updateOne(
    { _id: docId, [`${config.array}.${config.idField}`]: dto.id },
    {
      $pull: {
        [`${config.array}.$.sessions`]: { session_id: dto.session_id }
      } as any
    }
  );

  return { success: true };
}

 async deleteUser(dto: DeleteUserDto) {
  const config = ROLE_CONFIG[dto.role];
  const docId = new Types.ObjectId(config.doc);

  // Remove user from memory array
  const memResult = await this.universityConnection.collection("memory").updateOne(
    { _id: docId },
    { $pull: { [config.array]: { [config.idField]: dto.id } } as any }
  );
  console.log("Memory update result:", memResult);

  // Remove user from user collection array (students, faculty, etc.)
  const userDocId = new Types.ObjectId("68d3d10671bbe5af3a79a45b");
  const arrayName = dto.role === "faculty" ? "faculty" : `${config.array}s`;
  const userResult = await this.universityConnection.collection("user").updateOne(
    { _id: userDocId },
    { $pull: { [arrayName]: { [config.idField]: dto.id } } as any }
  );
  console.log("User collection update result:", userResult);

  return { memResult, userResult, success: true };
}

  async getUserMemory(role: string, id: string) {
    const config = ROLE_CONFIG[role];
    const docId = new Types.ObjectId(config.doc);

    const doc = await this.universityConnection
      .collection("memory")
      .findOne({ _id: docId });
    if (!doc) return null;

    const user = (doc[config.array] || []).find(
      (u: any) => u[config.idField] === id
    );
    return user || null;
  }
}
