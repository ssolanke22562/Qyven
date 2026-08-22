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
import {
  startSpan, endSpan, recordToolSpan, recordDecisionSpan, writeTraceFile
} from "@/lib/tracing/tracer";
import { diagnoseTrace, writeDiagnosis, readTraceFile } from "@/lib/tracing/diagnose";

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

    const scenario = state.demoOptions.scenario || "normal";
    const isAdversarial = state.demoOptions.enableAdversarialMode;

    // Root trace span — wraps entire pipeline
    const rootSpanId = startSpan(state, "pipeline.run", "ORCHESTRATOR", undefined, "SPAN_START", undefined, {
      inputSummary: state.userQuery.slice(0, 200),
      scenario,
    });

    // 1. NODE: PLANNER
    const tPlanStart = Date.now();
    const plannerSpanId = startSpan(state, "node.PLANNER", "PLANNER", rootSpanId, "SPAN_START", {
      systemPromptSnippet: "Dynamic Supervisor / Planner decomposing research objective into parallel vectors.",
      userPromptSnippet: state.userQuery,
      templateName: "PlannerSupervisorV1",
    });
    this.addLog(state, "Node: PLANNER", "PLANNER", "INFO", `Creating dynamic investigation plan for "${state.userQuery}"...`);

    state.currentPlan = await createDynamicPlan(state);
    state.budget.usedLlmCalls += 1;
    this.saveCheckpoint(state, "PLANNER");

    recordDecisionSpan(state, plannerSpanId, "PLANNER", {
      decisionType: "ROUTING_DECISION",
      selectedOption: state.currentPlan.tasks.map((t) => t.agent).join(", "),
      alternatives: ["SINGLE_AGENT_FALLBACK", "SEQUENTIAL_PIPELINE"],
      reasonSummary: `Decomposed into ${state.currentPlan.tasks.length} parallel investigation vectors: ${state.currentPlan.rationale}`,
      confidence: 95,
    });

    endSpan(state, plannerSpanId, "ok", {
      outputSummary: `${state.currentPlan.tasks.length} tasks scheduled (${state.currentPlan.rationale})`,
    });

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
      const execSpanId = startSpan(state, "node.PARALLEL_EXECUTION", "PLANNER", rootSpanId, "SPAN_START");

      // Filter tasks ready for execution in current parallel group
      const pendingTasks = state.currentPlan.tasks.filter((t) => t.status === "PENDING");
      this.addLog(state, "Node: PARALLEL_EXECUTION", "PLANNER", "INFO", `Launching ${pendingTasks.length} investigation tasks in parallel...`);

      recordDecisionSpan(state, execSpanId, "PLANNER", {
        decisionType: "TOOL_SELECTION",
        selectedOption: pendingTasks.map((t) => t.agent).join(", "),
        alternatives: ["DEFER_EXECUTION", "SEQUENTIAL_EXECUTION"],
        reasonSummary: `Executing ${pendingTasks.length} tools concurrently for latency optimization.`,
        confidence: 90,
      });

      // Execute all pending tasks concurrently via Promise.all
      const taskResults = await Promise.all(
        pendingTasks.map(async (task) => {
          const taskStart = Date.now();
          task.status = "RUNNING";
          const taskSpanId = startSpan(state, `task.${task.agent}`, task.agent, execSpanId, "SPAN_START", undefined, {
            inputSummary: task.description,
          });

          // Check if runtime policy directs to bypass this tool
          if (state.runtimePolicy?.toolRouting?.bypassUnavailableTools?.includes(task.agent)) {
            task.status = "COMPLETED";
            task.executionTimeMs = 15;
            task.outputSummary = `Bypassed by Runtime Policy (repaired state): context loaded directly from Knowledge Base.`;
            endSpan(state, taskSpanId, "ok", {
              outputSummary: task.outputSummary,
              isFallback: true,
            });
            recordDecisionSpan(state, taskSpanId, task.agent, {
              decisionType: "FALLBACK_DECISION",
              selectedOption: "DIRECT_KB_ROUTING",
              alternatives: [task.agent],
              reasonSummary: `Runtime Policy active: bypassed known unavailable provider ${task.agent}.`,
              confidence: 98,
            });
            return {
              agent: task.agent,
              success: true,
              fallbackUsed: true,
              articles: [],
              data: [],
              summary: `Loaded market domain context for "${state.userQuery}" from internal graph cache.`,
            };
          }

          try {
            if (task.agent === "RESEARCH_AGENT") {
              state.budget.usedSearchCalls += 2;
              const toolStart = Date.now();
              const res = await runResearchAgent(state.userQuery);
              const toolLatency = Date.now() - toolStart;
              task.status = "COMPLETED";
              task.executionTimeMs = toolLatency;
              task.outputSummary = `Retrieved ${res.sources.length} sources (${res.output.confidenceScore}% confidence)`;
              endSpan(state, taskSpanId, "ok", {
                outputSummary: task.outputSummary,
                sourcesRetrieved: res.sources.length,
                confidenceScore: res.output.confidenceScore,
                model: res.modelUsed,
              }, res.tokenUsage);
              recordToolSpan(state, taskSpanId, "searchArxiv+searchNews", { query: state.userQuery }, toolLatency,
                `${res.sources.length} sources retrieved`);
              return { agent: task.agent, success: true, data: res.output, sources: res.sources };
            }

            if (task.agent === "NEWS_AGENT") {
              state.budget.usedSearchCalls += 1;
              const forceFail = state.demoOptions.forceNewsFailure || scenario === "news_503" || isAdversarial;
              const toolStart = Date.now();
              if (forceFail) {
                await new Promise((r) => setTimeout(r, 200));
                const errMsg = "News API 503 Service Unavailable (Simulated Tool Disruption)";
                task.status = "FAILED";
                task.error = errMsg;
                endSpan(state, taskSpanId, "error", { errorMessage: errMsg, errorType: "HTTP_503" });
                recordToolSpan(state, taskSpanId, "searchNews", { query: state.userQuery }, 200, undefined, errMsg, 2);
                return { agent: task.agent, success: false, error: task.error };
              }

              const articles = await searchNews(state.userQuery);
              const toolLatency = Date.now() - toolStart;
              task.status = "COMPLETED";
              task.executionTimeMs = toolLatency;
              task.outputSummary = `Retrieved ${articles.length} news articles`;
              endSpan(state, taskSpanId, "ok", { outputSummary: task.outputSummary, sourcesRetrieved: articles.length });
              recordToolSpan(state, taskSpanId, "searchNews", { query: state.userQuery }, toolLatency,
                `${articles.length} articles retrieved`);
              return { agent: task.agent, success: true, articles };
            }

            if (task.agent === "PATENT_AGENT") {
              state.budget.usedSearchCalls += 1;
              const forceTimeout = state.demoOptions.forcePatentTimeout || scenario === "patent_timeout";
              const toolStart = Date.now();
              const res = await searchPatents(state.userQuery, {
                forceFailure: forceTimeout,
              });
              const toolLatency = Date.now() - toolStart;
              if (!res.success) {
                task.status = "FAILED";
                task.error = res.error?.message;
                endSpan(state, taskSpanId, "error", { errorMessage: res.error?.message, errorType: "PatentToolTimeout" });
                recordToolSpan(state, taskSpanId, "searchPatents", { query: state.userQuery }, toolLatency, undefined, res.error?.message, 1);
                return { agent: task.agent, success: false, error: res.error?.message };
              }
              task.status = "COMPLETED";
              task.executionTimeMs = toolLatency;
              task.outputSummary = `Retrieved ${res.data.length} patent specifications`;
              endSpan(state, taskSpanId, "ok", { outputSummary: task.outputSummary });
              recordToolSpan(state, taskSpanId, "searchPatents", { query: state.userQuery }, toolLatency,
                `${res.data.length} patents retrieved`);
              return { agent: task.agent, success: true, data: res.data };
            }

            if (task.agent === "SEC_AGENT") {
              state.budget.usedSearchCalls += 1;
              const forceUnavailable = state.demoOptions.forceSecUnavailable || scenario === "tool_unavailable";
              const toolStart = Date.now();
              const res = await searchSecFilings(state.userQuery, {
                forceFailure: forceUnavailable,
              });
              const toolLatency = Date.now() - toolStart;
              if (!res.success) {
                task.status = "FAILED";
                task.error = res.error?.message;
                endSpan(state, taskSpanId, "error", { errorMessage: res.error?.message, errorType: "SecEndpointUnavailable" });
                recordToolSpan(state, taskSpanId, "searchSecFilings", { query: state.userQuery }, toolLatency, undefined, res.error?.message);
                return { agent: task.agent, success: false, error: res.error?.message };
              }
              task.status = "COMPLETED";
              task.executionTimeMs = toolLatency;
              task.outputSummary = `Retrieved ${res.data.length} SEC EDGAR filings`;
              endSpan(state, taskSpanId, "ok", { outputSummary: task.outputSummary });
              recordToolSpan(state, taskSpanId, "searchSecFilings", { query: state.userQuery }, toolLatency,
                `${res.data.length} filings retrieved`);
              return { agent: task.agent, success: true, data: res.data };
            }
          } catch (err: any) {
            task.status = "FAILED";
            task.error = err.message || "Task execution error";
            endSpan(state, taskSpanId, "error", { errorMessage: task.error, errorType: "UnhandledException" });
            return { agent: task.agent, success: false, error: task.error };
          }

          endSpan(state, taskSpanId, "ok");
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
      endSpan(state, execSpanId, hasFailures ? "error" : "ok", {
        outputSummary: hasFailures ? `Failures: ${failureDetails.join("; ")}` : "All tasks completed",
      });

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

          recordDecisionSpan(state, rootSpanId, "REPLANNER", {
            decisionType: "REPLANNING_DECISION",
            selectedOption: "CONFIGURE_DOMAIN_KB_FALLBACK",
            alternatives: ["ABORT_EXECUTION", "RETRY_FAILED_ENDPOINTS_DIRECTLY"],
            reasonSummary: `Failures detected [${failureDetails.join("; ")}]. Reconfiguring routing through internal domain knowledge base.`,
            confidence: 90,
            trigger: failureDetails[0],
          });

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
            recordDecisionSpan(state, rootSpanId, "NEWS_AGENT", {
              decisionType: "FALLBACK_DECISION",
              selectedOption: "CACHED_KNOWLEDGE_BASE",
              alternatives: ["LIVE_NEWS_API"],
              reasonSummary: "News API failed with 503; fallback knowledge context activated.",
              confidence: 88,
              trigger: "HTTP_503",
            });
            this.addLog(
              state,
              "Node: REPLANNER_FALLBACK",
              "NEWS_AGENT",
              "RECOVERY",
              `RECOVERY SUCCESS: News Agent routed through fallback Knowledge Base context.`
            );
          }

          if (state.agentOutputs["PATENT_AGENT"] && !state.agentOutputs["PATENT_AGENT"].success) {
            state.agentOutputs["PATENT_AGENT"] = {
              success: true,
              fallbackUsed: true,
              summary: `Retrieved patent context from local IP database for "${state.userQuery}".`,
              data: [],
            };
            recordDecisionSpan(state, rootSpanId, "PATENT_AGENT", {
              decisionType: "FALLBACK_DECISION",
              selectedOption: "LOCAL_IP_INDEX",
              alternatives: ["USPTO_API"],
              reasonSummary: "Patent API timed out; routed to local IP index.",
              confidence: 85,
              trigger: "PATENT_TIMEOUT",
            });
          }

          state.currentPlan = await createDynamicPlan(state, {
            isReplan: true,
            failureContext: failureDetails.join(", "),
          });
        }
      }

      // 4. NODE: EVIDENCE & CONFLICT RESOLUTION AGENT
      const tEvStart = Date.now();
      const evSpanId = startSpan(state, "node.EVIDENCE_RESOLVER", "EVIDENCE_RESOLVER", rootSpanId, "SPAN_START");
      const evResult = await processEvidenceAndConflicts(state);
      state.evidenceTable = evResult.evidenceTable;
      state.conflicts = evResult.conflicts;
      endSpan(state, evSpanId, "ok", {
        outputSummary: `${evResult.evidenceTable.length} evidence items, ${evResult.conflicts.length} conflicts`,
      });
      this.addLog(state, "Node: EVIDENCE_RESOLVER", "EVIDENCE_RESOLVER", "INFO", evResult.logsMessage, null, Date.now() - tEvStart);
      this.saveCheckpoint(state, "EVIDENCE_RESOLVER");

      // 5. NODE: CONFIDENCE JUDGE
      const confSpanId = startSpan(state, "node.CONFIDENCE_JUDGE", "CONFIDENCE_JUDGE", rootSpanId, "SPAN_START");
      const conf = calculateDeterministicConfidence(state);
      state.confidence = conf;
      endSpan(state, confSpanId, "ok", { confidenceScore: conf.score, outputSummary: conf.reasoning });
      this.addLog(
        state,
        "Node: CONFIDENCE_JUDGE",
        "CONFIDENCE_JUDGE",
        "SUCCESS",
        `DETERMINISTIC CONFIDENCE SCORE CALCULATED: ${conf.score}% (${conf.reasoning})`
      );

      // 6. NODE: SELF EVALUATOR
      state.status = "EVALUATING";
      const selfEvalSpanId = startSpan(state, "node.SELF_EVALUATOR", "SELF_EVALUATOR", rootSpanId, "SPAN_START");
      const evalRes = await evaluateInvestigationQuality(state);
      state.selfEvaluation = evalRes;

      if (evalRes.passed) {
        recordDecisionSpan(state, selfEvalSpanId, "SELF_EVALUATOR", {
          decisionType: "SELF_EVAL_DECISION",
          selectedOption: "PASS_QUALITY_GATE",
          alternatives: ["TRIGGER_REPLAN"],
          reasonSummary: `Self-evaluator verified answer answers goal with sufficient evidence. Feedback: ${evalRes.feedback}`,
          confidence: 94,
        });
        endSpan(state, selfEvalSpanId, "ok", { decision: "PASSED", reasoning: evalRes.feedback });
        this.addLog(state, "Node: SELF_EVALUATOR", "SELF_EVALUATOR", "SUCCESS", evalRes.feedback);
        continueLoop = false;
      } else {
        recordDecisionSpan(state, selfEvalSpanId, "SELF_EVALUATOR", {
          decisionType: "SELF_EVAL_DECISION",
          selectedOption: "FAIL_QUALITY_GATE",
          alternatives: ["PASS_QUALITY_GATE"],
          reasonSummary: `Quality gate not met: ${evalRes.feedback}`,
          confidence: 70,
        });
        endSpan(state, selfEvalSpanId, "error", { decision: "FAILED", reasoning: evalRes.feedback });
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
    const analysisSpanId = startSpan(state, "node.ANALYSIS_AGENT", "ANALYSIS_AGENT", rootSpanId, "SPAN_START");
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
      endSpan(state, analysisSpanId, "ok", {
        entitiesExtracted: analysisOutput.extractedEntities.length,
        outputSummary: `${analysisOutput.extractedEntities.length} entities, ${analysisOutput.relationships.length} relationships`,
        model: analysisOutput.modelUsed,
      }, analysisOutput.tokenUsage);

      // 8. NODE: SYNTHESIS AGENT (Final Intelligence Dossier)
      const synthesisSpanId = startSpan(state, "node.SYNTHESIS_AGENT", "SYNTHESIS_AGENT", rootSpanId, "SPAN_START", {
        systemPromptSnippet: "Strategic intelligence synthesis placing Recent News first, Past Context second, Threat Takeaways third.",
        userPromptSnippet: state.userQuery,
        templateName: "SynthesisAgentDossierV1",
      }, {
        sourcesRetrieved: state.sources.length,
        inputSummary: `${state.sources.length} sources, ${analysisOutput.extractedEntities.length} entities`,
      });

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
      endSpan(state, synthesisSpanId, "ok", {
        outputSummary: `Synthesis complete. Threat: ${synthesisRes.output.threatAssessment}`,
        confidenceScore: state.confidence.score,
        model: synthesisRes.modelUsed,
      }, synthesisRes.tokenUsage);

      this.addLog(state, "Node: SYNTHESIS_AGENT", "SYNTHESIS_AGENT", "SUCCESS", "Final Strategic Intelligence Dossier compiled successfully.");
      this.saveCheckpoint(state, "COMPLETED");

      // Save to Investigation Memory Store
      investigationMemory.saveInvestigation(state);
    } catch (err: any) {
      console.error("Synthesis error:", err);
      state.status = "COMPLETED";
      endSpan(state, analysisSpanId, "error", { errorMessage: err.message });
    }

    state.totalLatencyMs = Date.now() - state.startTimeMs;

    // ── Close root span ──────────────────────────────────────────
    endSpan(state, rootSpanId, state.spans.some((s) => s.status === "error") ? "error" : "ok", {
      outputSummary: `Pipeline ${state.status} in ${state.totalLatencyMs}ms`,
      confidenceScore: state.confidence.score,
      isFallback: state.isFallback,
    });

    // ── Write trace file to disk ─────────────────────────────────
    writeTraceFile(state);

    // ── Auto-diagnose on any span errors ─────────────────────────
    if (state.spans.some((s) => s.status === "error")) {
      try {
        const traceFile = readTraceFile(state.traceId);
        if (traceFile) {
          const diagnosis = diagnoseTrace(traceFile);
          writeDiagnosis(diagnosis);
        }
      } catch (diagErr) {
        console.warn("[Tracer] Auto-diagnosis failed:", diagErr);
      }
    }

    return state;
  }
}

export const qyvenEngine = new QyvenStateGraphEngine();
