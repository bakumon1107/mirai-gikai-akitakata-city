import {
  bills,
  tags,
  councilSessions,
  factions,
  committees,
  createFactionStances,
  createBillsTags,
  createInterviewConfig,
  createInterviewQuestions,
  createInterviewSessions,
  createInterviewMessages,
  createInterviewReports,
  createDemoSession,
  createDemoMessages,
  createDemoReport,
  createAdditionalDemoSessions,
  createAdditionalDemoMessages,
  createAdditionalDemoReports,
  DEMO_REPORT_ID,
  DEMO_REPORT_ID_WORK,
  DEMO_REPORT_ID_DAILY,
  DEMO_REPORT_ID_CITIZEN,
} from "./data";
import { createBillContents } from "./bill-contents-data";
import {
  createShippingBillInterviewConfig,
  createShippingBillQuestions,
  createShippingBillSessions,
  createShippingBillMessages,
  createShippingBillReports,
} from "./shipping-bill-data";
import { createAdminClient, clearAllData } from "../shared/helper";

async function seedDatabase() {
  const supabase = createAdminClient();
  console.log("🌱 Starting database seeding...");

  try {
    await clearAllData(supabase);

    // Insert tags
    console.log("🏷️  Inserting tags...");
    const { data: insertedTags, error: tagsError } = await supabase
      .from("tags")
      .insert(tags)
      .select("id, label");

    if (tagsError) {
      throw new Error(`Failed to insert tags: ${tagsError.message}`);
    }

    if (!insertedTags) {
      throw new Error("No tags were inserted");
    }

    console.log(`✅ Inserted ${insertedTags.length} tags`);

    // Insert council sessions
    console.log("🏛️  Inserting council sessions...");
    const { data: insertedCouncilSessions, error: councilSessionsError } =
      await supabase
        .from("council_sessions")
        .insert(councilSessions)
        .select("id");

    if (councilSessionsError) {
      throw new Error(
        `Failed to insert council sessions: ${councilSessionsError.message}`
      );
    }

    if (!insertedCouncilSessions) {
      throw new Error("No council sessions were inserted");
    }

    console.log(
      `✅ Inserted ${insertedCouncilSessions.length} council sessions`
    );

    // Insert committees
    console.log("🏢 Inserting committees...");
    const { data: insertedCommittees, error: committeesError } = await supabase
      .from("committees")
      .insert(committees)
      .select("id, name");

    if (committeesError) {
      throw new Error(
        `Failed to insert committees: ${committeesError.message}`
      );
    }

    if (!insertedCommittees) {
      throw new Error("No committees were inserted");
    }

    console.log(`✅ Inserted ${insertedCommittees.length} committees`);

    // Insert factions
    console.log("🏛️  Inserting factions...");
    const { data: insertedFactions, error: factionsError } = await supabase
      .from("factions")
      .insert(factions)
      .select("id, name");

    if (factionsError) {
      throw new Error(
        `Failed to insert factions: ${factionsError.message}`
      );
    }

    if (!insertedFactions) {
      throw new Error("No factions were inserted");
    }

    console.log(`✅ Inserted ${insertedFactions.length} factions`);

    // Insert bills
    console.log("📄 Inserting bills...");
    const { data: insertedBills, error: billsError } = await supabase
      .from("bills")
      .insert(bills)
      .select("id, name");

    if (billsError) {
      throw new Error(`Failed to insert bills: ${billsError.message}`);
    }

    if (!insertedBills) {
      throw new Error("No bills were inserted");
    }

    console.log(`✅ Inserted ${insertedBills.length} bills`);

    // Link first 3 bills to the current council session
    const currentSessionId = insertedCouncilSessions[0]?.id;
    if (currentSessionId) {
      const billsToLink = insertedBills.slice(0, 3);
      for (const bill of billsToLink) {
        await supabase
          .from("bills")
          .update({ council_session_id: currentSessionId })
          .eq("id", bill.id);
      }
      console.log(
        `🔗 Linked ${billsToLink.length} bills to current council session`
      );
    }

    // Link last 5 bills to the previous council session
    const previousSessionId = insertedCouncilSessions[1]?.id;
    if (previousSessionId) {
      const previousBills = insertedBills.slice(-5);
      for (const bill of previousBills) {
        await supabase
          .from("bills")
          .update({ council_session_id: previousSessionId })
          .eq("id", bill.id);
      }
      console.log(
        `🔗 Linked ${previousBills.length} bills to previous council session`
      );
    }

    // Insert bill_contents
    console.log("📚 Inserting bill contents...");
    const billContents = createBillContents(insertedBills);

    const { data: insertedContents, error: contentsError } = await supabase
      .from("bill_contents")
      .insert(billContents)
      .select("id");

    if (contentsError) {
      throw new Error(
        `Failed to insert bill contents: ${contentsError.message}`
      );
    }

    if (!insertedContents) {
      throw new Error("No bill contents were inserted");
    }

    console.log(`✅ Inserted ${insertedContents.length} bill contents`);

    // Insert faction_stances (みらい会派の見解)
    console.log("🎯 Inserting faction stances...");
    const miraiFaction = insertedFactions.find((f) => f.name === "mirai");
    let insertedStancesCount = 0;

    if (miraiFaction) {
      const factionStances = createFactionStances(
        insertedBills,
        miraiFaction.id
      );

      const { data: insertedStances, error: stancesError } = await supabase
        .from("faction_stances")
        .insert(factionStances)
        .select("id");

      if (stancesError) {
        throw new Error(
          `Failed to insert faction stances: ${stancesError.message}`
        );
      }

      if (insertedStances) {
        insertedStancesCount = insertedStances.length;
      }
    }

    console.log(`✅ Inserted ${insertedStancesCount} faction stances`);

    // Insert bills_tags (関連付け)
    console.log("🔗 Inserting bills-tags relations...");
    const billsTags = createBillsTags(insertedBills, insertedTags);

    const { data: insertedBillsTags, error: billsTagsError } = await supabase
      .from("bills_tags")
      .insert(billsTags)
      .select();

    if (billsTagsError) {
      throw new Error(
        `Failed to insert bills-tags relations: ${billsTagsError.message}`
      );
    }

    if (!insertedBillsTags) {
      throw new Error("No bills-tags relations were inserted");
    }

    console.log(`✅ Inserted ${insertedBillsTags.length} bills-tags relations`);

    // Insert interview config (for first bill)
    console.log("💬 Inserting interview config...");
    const interviewConfigData = createInterviewConfig(insertedBills);
    let insertedQuestionsCount = 0;
    let insertedSessionsCount = 0;
    let insertedMessagesCount = 0;
    let insertedReportsCount = 0;

    if (interviewConfigData) {
      const { data: insertedConfig, error: configError } = await supabase
        .from("interview_configs")
        .insert(interviewConfigData)
        .select("id")
        .single();

      if (configError) {
        throw new Error(
          `Failed to insert interview config: ${configError.message}`
        );
      }

      if (insertedConfig) {
        console.log(`✅ Inserted interview config`);

        // Insert interview questions
        console.log("❓ Inserting interview questions...");
        const questionsData = createInterviewQuestions(insertedConfig.id);

        const { data: insertedQuestions, error: questionsError } =
          await supabase
            .from("interview_questions")
            .insert(questionsData)
            .select("id");

        if (questionsError) {
          throw new Error(
            `Failed to insert interview questions: ${questionsError.message}`
          );
        }

        if (insertedQuestions) {
          insertedQuestionsCount = insertedQuestions.length;
          console.log(
            `✅ Inserted ${insertedQuestionsCount} interview questions`
          );
        }

        // Insert interview sessions
        console.log("🗣️ Inserting interview sessions...");
        const sessionsData = createInterviewSessions(insertedConfig.id);

        const { data: insertedSessions, error: sessionsError } = await supabase
          .from("interview_sessions")
          .insert(sessionsData)
          .select("id");

        if (sessionsError) {
          throw new Error(
            `Failed to insert interview sessions: ${sessionsError.message}`
          );
        }

        if (insertedSessions && insertedSessions.length > 0) {
          insertedSessionsCount = insertedSessions.length;
          console.log(
            `✅ Inserted ${insertedSessionsCount} interview sessions`
          );

          // Insert interview messages
          console.log("💬 Inserting interview messages...");
          const sessionIds = insertedSessions.map((s) => s.id);
          const messagesData = createInterviewMessages(sessionIds);

          const { data: insertedMessages, error: messagesError } =
            await supabase
              .from("interview_messages")
              .insert(messagesData)
              .select("id");

          if (messagesError) {
            throw new Error(
              `Failed to insert interview messages: ${messagesError.message}`
            );
          }

          if (insertedMessages) {
            insertedMessagesCount = insertedMessages.length;
            console.log(
              `✅ Inserted ${insertedMessagesCount} interview messages`
            );
          }

          // Insert interview reports
          console.log("📊 Inserting interview reports...");
          const reportsData = createInterviewReports(sessionIds);

          const { data: insertedReports, error: reportsError } = await supabase
            .from("interview_report")
            .insert(reportsData)
            .select("id");

          if (reportsError) {
            throw new Error(
              `Failed to insert interview reports: ${reportsError.message}`
            );
          }

          if (insertedReports) {
            insertedReportsCount = insertedReports.length;
            console.log(
              `✅ Inserted ${insertedReportsCount} interview reports`
            );
          }

          // Insert demo session, messages, and report with fixed IDs
          console.log("🎯 Inserting demo data with fixed IDs...");

          const demoSession = createDemoSession(insertedConfig.id);
          const { error: demoSessionError } = await supabase
            .from("interview_sessions")
            .insert(demoSession);

          if (demoSessionError) {
            throw new Error(
              `Failed to insert demo session: ${demoSessionError.message}`
            );
          }

          const demoMessages = createDemoMessages();
          const { error: demoMessagesError } = await supabase
            .from("interview_messages")
            .insert(demoMessages);

          if (demoMessagesError) {
            throw new Error(
              `Failed to insert demo messages: ${demoMessagesError.message}`
            );
          }

          const demoReport = createDemoReport();
          const { error: demoReportError } = await supabase
            .from("interview_report")
            .insert(demoReport);

          if (demoReportError) {
            throw new Error(
              `Failed to insert demo report: ${demoReportError.message}`
            );
          }

          console.log(`✅ Inserted demo data`);
          console.log(
            `   Demo report URL: /report/${DEMO_REPORT_ID}/chat-log`
          );

          // Insert additional demo sessions, messages, and reports (for 4 role types)
          console.log(
            "🎭 Inserting additional demo data for all role types..."
          );

          const additionalDemoSessions = createAdditionalDemoSessions(
            insertedConfig.id
          );
          const { error: additionalSessionsError } = await supabase
            .from("interview_sessions")
            .insert(additionalDemoSessions);

          if (additionalSessionsError) {
            throw new Error(
              `Failed to insert additional demo sessions: ${additionalSessionsError.message}`
            );
          }

          const additionalDemoMessages = createAdditionalDemoMessages();
          const { error: additionalMessagesError } = await supabase
            .from("interview_messages")
            .insert(additionalDemoMessages);

          if (additionalMessagesError) {
            throw new Error(
              `Failed to insert additional demo messages: ${additionalMessagesError.message}`
            );
          }

          const additionalDemoReports = createAdditionalDemoReports();
          const { error: additionalReportsError } = await supabase
            .from("interview_report")
            .insert(additionalDemoReports);

          if (additionalReportsError) {
            throw new Error(
              `Failed to insert additional demo reports: ${additionalReportsError.message}`
            );
          }

          console.log(
            `✅ Inserted additional demo data for all 4 role types`
          );
          console.log(
            `   subject_expert: /report/${DEMO_REPORT_ID}/chat-log`
          );
          console.log(
            `   work_related: /report/${DEMO_REPORT_ID_WORK}/chat-log`
          );
          console.log(
            `   daily_life_affected: /report/${DEMO_REPORT_ID_DAILY}/chat-log`
          );
          console.log(
            `   general_citizen: /report/${DEMO_REPORT_ID_CITIZEN}/chat-log`
          );
        }
      }
    } else {
      console.log("⚠️ Skipped interview config (no bills found)");
    }

    // === 船荷証券法案のインタビューデータ（トピック解析テスト用）===
    console.log("🚢 Inserting shipping bill interview data...");
    const shippingConfig = createShippingBillInterviewConfig(insertedBills);
    let shippingSessionsCount = 0;
    let shippingReportsCount = 0;

    if (shippingConfig) {
      const { data: insertedShippingConfig, error: shippingConfigError } =
        await supabase
          .from("interview_configs")
          .insert(shippingConfig)
          .select("id")
          .single();

      if (shippingConfigError) {
        throw new Error(
          `Failed to insert shipping bill config: ${shippingConfigError.message}`
        );
      }

      if (insertedShippingConfig) {
        // Questions
        const shippingQuestions = createShippingBillQuestions(
          insertedShippingConfig.id
        );
        const { error: sqError } = await supabase
          .from("interview_questions")
          .insert(shippingQuestions);
        if (sqError) {
          throw new Error(
            `Failed to insert shipping questions: ${sqError.message}`
          );
        }

        // Sessions (100件)
        const shippingSessions = createShippingBillSessions(
          insertedShippingConfig.id
        );
        const { data: insertedShippingSessions, error: ssError } =
          await supabase
            .from("interview_sessions")
            .insert(shippingSessions)
            .select("id");
        if (ssError) {
          throw new Error(
            `Failed to insert shipping sessions: ${ssError.message}`
          );
        }

        if (insertedShippingSessions) {
          shippingSessionsCount = insertedShippingSessions.length;
          const shippingSessionIds = insertedShippingSessions.map(
            (s) => s.id
          );

          // Messages
          const shippingMessages =
            createShippingBillMessages(shippingSessionIds);
          const { error: smError } = await supabase
            .from("interview_messages")
            .insert(shippingMessages);
          if (smError) {
            throw new Error(
              `Failed to insert shipping messages: ${smError.message}`
            );
          }

          // ユーザーメッセージのIDを取得して source_message_id を紐付け
          const { data: userMessages, error: umError } = await supabase
            .from("interview_messages")
            .select("id, interview_session_id, content")
            .in("interview_session_id", shippingSessionIds)
            .eq("role", "user")
            .neq("content", "賛成です。")
            .neq("content", "反対です。")
            .neq("content", "条件付きで賛成です。")
            .neq("content", "判断が難しいです。")
            .order("created_at", { ascending: true })
            .order("id", { ascending: true });
          if (umError) {
            throw new Error(
              `Failed to fetch user messages: ${umError.message}`
            );
          }

          // セッションID → ユーザーメッセージIDリストのマップを構築
          const sessionMessageMap = new Map<
            string,
            Array<{ id: string; content: string }>
          >();
          for (const msg of userMessages || []) {
            const list = sessionMessageMap.get(msg.interview_session_id) || [];
            list.push({ id: msg.id, content: msg.content });
            sessionMessageMap.set(msg.interview_session_id, list);
          }

          // Reports (100件、各3 opinions) — source_message_id を含む
          const shippingReports = createShippingBillReports(shippingSessionIds);
          for (const report of shippingReports) {
            const msgs = sessionMessageMap.get(
              report.interview_session_id
            );
            if (msgs && Array.isArray(report.opinions)) {
              const opinions = (
                report.opinions as Array<{
                  title: string;
                  content: string;
                  source_message_content?: string;
                  source_message_id?: string;
                }>
              ).map((opinion) => ({ ...opinion }));
              report.opinions = opinions;
              for (let j = 0; j < opinions.length; j++) {
                if (msgs[j]) {
                  opinions[j].source_message_id = msgs[j].id;
                  opinions[j].source_message_content = msgs[j].content;
                }
              }
            }
          }

          const { data: insertedShippingReports, error: srError } =
            await supabase
              .from("interview_report")
              .insert(shippingReports)
              .select("id");
          if (srError) {
            throw new Error(
              `Failed to insert shipping reports: ${srError.message}`
            );
          }

          if (insertedShippingReports) {
            shippingReportsCount = insertedShippingReports.length;
          }
        }

        console.log(
          `✅ Shipping bill: ${shippingSessionsCount} sessions, ${shippingReportsCount} reports (each with 3 opinions)`
        );
      }
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  Council Sessions: ${insertedCouncilSessions.length}`);
    console.log(`  Committees: ${insertedCommittees.length}`);
    console.log(`  Factions: ${insertedFactions.length}`);
    console.log(`  Tags: ${insertedTags.length}`);
    console.log(`  Bills: ${insertedBills.length}`);
    console.log(`  Bill Contents: ${insertedContents.length}`);
    console.log(`  Faction Stances: ${insertedStancesCount}`);
    console.log(`  Bills-Tags Relations: ${insertedBillsTags.length}`);
    console.log(`  Interview Config: ${interviewConfigData ? 1 : 0}`);
    console.log(`  Interview Questions: ${insertedQuestionsCount}`);
    console.log(`  Interview Sessions: ${insertedSessionsCount}`);
    console.log(`  Interview Messages: ${insertedMessagesCount}`);
    console.log(`  Interview Reports: ${insertedReportsCount}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
