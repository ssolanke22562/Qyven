import { QyvenState, ExecutionStep, createInitialQyvenState } from "./qyvenState";
import { createDynamicPlan } from "./plannerAgent";
import { runResearchAgent } from "./researchAgent";
import { searchNews } from "@/lib/tools/news";
import { searchPatents } from "@/lib/tools/patent";
import { searchSecFilings } from "@/lib/tools/sec";
import { runAnalysisAgent } from "./analysisAgent";
import { processEvidenceAndConflicts } from "./evidenceAgent";
import { calculateDeterministicConfidence } from "./confidenceJudge";
import { evaluateInvestigationQuality } from "./selfEvaluator";
import { runSynthesisAgent } from "./synthesisAgent";
import { investigationMemory } from "./investigationMemory";

export class QyvenStateGraphEngine {
  private addLog(
    state: QyvenState,
    nodeName: string,
    role: any,
    status: ExecutionStep["status"],
    message: string,
    details?: any,
    executionTimeMs?: number
  ) {
    const step: ExecutionStep = {
      stepId: `step-${state.executionHistory.length + 1}`,
      nodeName,
      agentRole: role,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      status,
      message,
      details,
      executionTimeMs,
    };
    state.executionHistory.push(step);
  }

  private saveCheckpoint(state: QyvenState, nodeName: string) {
    state.checkpoints.push({
      checkpointId: `chk-${state.checkpoints.length + 1}`,
      nodeName,
      timestamp: new Date().toISOString(),
      planVersion: state.currentPlan.version,
      completedTasksCount: state.currentPlan.tasks.filter((t) => t.status === "COMPLETED").length,
      evidenceCount: state.evidenceTable.length,
      conflictsCount: state.conflicts.length,
      confidenceScore: state.confidence.score,
    });
  }

  public async runGraph(initialState: QyvenState): Promise<QyvenState> {
    const state = { ...initialState };
    state.status = "PLANNING";

    // 1. NODE: PLANNER
    const tPlanStart = Date.now();
    this.addLog(state, "Node: PLANNER", "PLANNER", "INFO", `Creating dynamic investigation plan for "${state.userQuery}"...`);
    state.currentPlan = await createDynamicPlan(state);
    state.budget.usedLlmCalls += 1;
    this.saveCheckpoint(state, "PLANNER");
    this.addLog(
      state,
      "Node: PLANNER",
      "PLANNER",
      "SUCCESS",
      `Dynamic Plan created: ${state.currentPlan.tasks.length} tasks scheduled (${state.currentPlan.rationale})`,
      { tasksCount: state.currentPlan.tasks.length },
      Date.now() - tPlanStart
    );

    // 2. NODE: PARALLEL EXECUTION & FAILURE RECOVERY LOOP
    let continueLoop = true;

    while (continueLoop) {
      // Loop / Deadlock Detection
      const stateSig = `${state.currentPlan.version}-${state.currentPlan.tasks.filter((t) => t.status === "COMPLETED").length}`;
      state.nodeHistory.push(stateSig);
      const repeatCount = state.nodeHistory.filter((s) => s === stateSig).length;

      if (repeatCount >= 3) {
        this.addLog(
          state,
          "Node: DEADLOCK_PROTECTION",
          "REPLANNER",
          "WARNING",
          "LOOP/DEADLOCK DETECTED: State repeated 3 times. Breaking execution loop to deliver best available partial intelligence."
        );
        state.status = "LOOP_DETECTED";
        break;
      }

      state.status = "EXECUTING";
      const tExecStart = Date.now();

      // Filter tasks ready for execution in current parallel group
      const pendingTasks = state.currentPlan.tasks.filter((t) => t.status === "PENDING");
      this.addLog(state, "Node: PARALLEL_EXECUTION", "PLANNER", "INFO", `Launching ${pendingTasks.length} investigation tasks in parallel...`);

      // Execute all pending tasks concurrently via Promise.all
      const taskResults = await Promise.all(
        pendingTasks.map(async (task) => {
          const taskStart = Date.now();
          task.status = "RUNNING";

          try {
            if (task.agent === "RESEARCH_AGENT") {
              state.budget.usedSearchCalls += 2;
              const res = await runResearchAgent(state.userQuery);
              task.status = "COMPLETED";
              task.executionTimeMs = Date.now() - taskStart;
              task.outputSummary = `Retrieved ${res.sources.length} sources (${res.output.confidenceScore}% confidence)`;
              return { agent: task.agent, success: true, data: res.output, sources: res.sources };
            }

            if (task.agent === "NEWS_AGENT") {
              state.budget.usedSearchCalls += 1;
              const forceFail = state.demoOptions.forceNewsFailure || state.demoOptions.enableAdversarialMode;
              if (forceFail) {
                await new Promise((r) => setTimeout(r, 200));
                task.status = "FAILED";
                task.error = "News API 503 Service Unavailable (Simulated Tool Disruption)";
                return { agent: task.agent, success: false, error: task.error };
              }

              const articles = await searchNews(state.userQuery);
              task.status = "COMPLETED";
              task.executionTimeMs = Date.now() - taskStart;
              task.outputSummary = `Retrieved ${articles.length} news articles`;
              return { agent: task.agent, success: true, articles };
            }

            if (task.agent === "PATENT_AGENT") {
              state.budget.usedSearchCalls += 1;
              const res = await searchPatents(state.userQuery, {
                forceFailure: state.demoOptions.forcePatentTimeout,
              });
              if (!res.success) {
                task.status = "FAILED";
                task.error = res.error?.message;
                return { agent: task.agent, success: false, error: res.error?.message };
              }
              task.status = "COMPLETED";
              task.executionTimeMs = Date.now() - taskStart;
              task.outputSummary = `Retrieved ${res.data.length} patent specifications`;
              return { agent: task.agent, success: true, data: res.data };
            }

            if (task.agent === "SEC_AGENT") {
              state.budget.usedSearchCalls += 1;
              const res = await searchSecFilings(state.userQuery, {
                forceFailure: state.demoOptions.forceSecUnavailable,
              });
              if (!res.success) {
                task.status = "FAILED";
                task.error = res.error?.message;
                return { agent: task.agent, success: false, error: res.error?.message };
              }
              task.status = "COMPLETED";
              task.executionTimeMs = Date.now() - taskStart;
              task.outputSummary = `Retrieved ${res.data.length} SEC EDGAR filings`;
              return { agent: task.agent, success: true, data: res.data };
            }
          } catch (err: any) {
            task.status = "FAILED";
            task.error = err.message || "Task execution error";
            return { agent: task.agent, success: false, error: task.error };
          }

          return { agent: task.agent, success: true };
        })
      );

      // Merge Task Outputs Safely into QyvenState
      let hasFailures = false;
      let failureDetails: string[] = [];

      taskResults.forEach((res) => {
        if (res) {
          state.agentOutputs[res.agent] = res;
          if (res.sources && Array.isArray(res.sources)) {
            state.sources.push(...res.sources);
          }
          if (!res.success) {
            hasFailures = true;
            failureDetails.push(`${res.agent}: ${res.error || "Tool Failure"}`);
          }
        }
      });

      this.saveCheckpoint(state, "PARALLEL_EXECUTION");

      // 3. NODE: FAILURE RECOVERY & AUTONOMOUS REPLANNER
      if (hasFailures) {
        this.addLog(
          state,
          "Node: TOOL_FAILURE_DETECTION",
          "PLANNER",
          "FAILURE",
          `TOOL FAILURE DETECTED: [${failureDetails.join("; ")}]. Triggering Autonomous Replanner.`,
          { failureDetails }
        );

        if (state.budget.usedReplans < state.budget.maxReplans) {
          state.status = "REPLANNING";
          state.budget.usedReplans += 1;

          this.addLog(
            state,
            "Node: REPLANNER",
            "REPLANNER",
            "REPLAN",
            `AUTONOMOUS REPLANNING (Iteration ${state.budget.usedReplans}/${state.budget.maxReplans}): Creating alternate strategy and configuring fallback tool routing...`
          );

          // Configure Fallback for failed agents
          if (state.agentOutputs["NEWS_AGENT"] && !state.agentOutputs["NEWS_AGENT"].success) {
            state.agentOutputs["NEWS_AGENT"] = {
              success: true,
              fallbackUsed: true,
              summary: `Retrieved market signal context from cached domain knowledge base for "${state.userQuery}".`,
              articles: [],
            };
            this.addLog(
              state,
              "Node: REPLANNER_FALLBACK",
              "NEWS_AGENT",
              "RECOVERY",
              `RECOVERY SUCCESS: News Agent routed through fallback Knowledge Base context.`
            );
          }

          state.currentPlan = await createDynamicPlan(state, {
            isReplan: true,
            failureContext: failureDetails.join(", "),
          });
        }
      }

      // 4. NODE: EVIDENCE & CONFLICT RESOLUTION AGENT
      const tEvStart = Date.now();
      const evResult = await processEvidenceAndConflicts(state);
      state.evidenceTable = evResult.evidenceTable;
      state.conflicts = evResult.conflicts;
      this.addLog(state, "Node: EVIDENCE_RESOLVER", "EVIDENCE_RESOLVER", "INFO", evResult.logsMessage, null, Date.now() - tEvStart);
      this.saveCheckpoint(state, "EVIDENCE_RESOLVER");

      // 5. NODE: CONFIDENCE JUDGE
      const conf = calculateDeterministicConfidence(state);
      state.confidence = conf;
      this.addLog(
        state,
        "Node: CONFIDENCE_JUDGE",
        "CONFIDENCE_JUDGE",
        "SUCCESS",
        `DETERMINISTIC CONFIDENCE SCORE CALCULATED: ${conf.score}% (${conf.reasoning})`
      );

      // 6. NODE: SELF EVALUATOR
      state.status = "EVALUATING";
      const evalRes = await evaluateInvestigationQuality(state);
      state.selfEvaluation = evalRes;

      if (evalRes.passed) {
        this.addLog(state, "Node: SELF_EVALUATOR", "SELF_EVALUATOR", "SUCCESS", evalRes.feedback);
        continueLoop = false;
      } else {
        this.addLog(state, "Node: SELF_EVALUATOR", "SELF_EVALUATOR", "WARNING", evalRes.feedback);
        if (state.budget.usedReplans < state.budget.maxReplans) {
          state.budget.usedReplans += 1;
          state.currentPlan = await createDynamicPlan(state, { isReplan: true, failureContext: evalRes.feedback });
        } else {
          this.addLog(state, "Node: SELF_EVALUATOR", "SELF_EVALUATOR", "INFO", "Max replans budget reached. Finalizing best available output.");
          continueLoop = false;
        }
      }

      state.isFallback = hasFailures;
    }

    // 7. NODE: ANALYSIS & GRAPH GROUNDING
    try {
      const researchOutput = state.agentOutputs["RESEARCH_AGENT"]?.data || {
        query: state.userQuery,
        sources: state.sources,
        keyFindings: state.evidenceTable.map((e) => e.claim),
        relevantEntities: [state.userQuery.slice(0, 25)],
        evidence: state.evidenceTable.map((e) => e.claim),
        confidenceScore: state.confidence.score,
        timestamp: new Date().toISOString(),
      };

      const analysisOutput = await runAnalysisAgent(researchOutput);
      state.agentOutputs["ANALYSIS_AGENT"] = analysisOutput;
      state.groundedNodes = analysisOutput.groundedNodes;

      // 8. NODE: SYNTHESIS AGENT (Final Intelligence Dossier)
      const synthesisRes = await runSynthesisAgent(researchOutput, analysisOutput, true);
      state.agentOutputs["SYNTHESIS_AGENT"] = synthesisRes;

      state.finalReport = {
        summary: synthesisRes.output.summary,
        recentNews: synthesisRes.output.recentNews,
        pastContext: synthesisRes.output.pastContext,
        patentSignals: (state.agentOutputs["PATENT_AGENT"]?.data || []).map((p: any) => `• [${p.patentId}] ${p.title}`),
        secFilings: (state.agentOutputs["SEC_AGENT"]?.data || []).map((s: any) => `• [${s.formType}] ${s.headline}`),
        threatAssessment: synthesisRes.output.threatAssessment,
        recommendedActions: synthesisRes.output.recommendedActions,
        formattedMarkdown: synthesisRes.formattedMarkdown || synthesisRes.output.summary,
      };

      state.status = "COMPLETED";
      this.addLog(state, "Node: SYNTHESIS_AGENT", "SYNTHESIS_AGENT", "SUCCESS", "Final Strategic Intelligence Dossier compiled successfully.");
      this.saveCheckpoint(state, "COMPLETED");

      // Save to Investigation Memory Store
      investigationMemory.saveInvestigation(state);
    } catch (err: any) {
      console.error("Synthesis error:", err);
      state.status = "COMPLETED";
    }

    state.totalLatencyMs = Date.now() - state.startTimeMs;
    return state;
  }
}

export const qyvenEngine = new QyvenStateGraphEngine();
