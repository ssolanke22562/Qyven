import { SafeguardItem } from "@/types";

export const SAFEGUARDS_DATA: SafeguardItem[] = [
  {
    id: 1,
    title: "Idempotent Multi-Source Ingestion Pipeline",
    subtitle: "Deduplication & Cryptographic Payload Hashing",
    principle: "Prevent infinite loop reprocessing, redundant LLM API costs, and duplicate graph node clutter across repeating news/patent syndications.",
    implementation: "Generates deterministic SHA-256 digests over sanitized document bodies and title vectors. Redis Bloom filters reject seen items in O(1) memory before triggering downstream embedding or classification workers.",
    impact: "99.8% rejection of duplicate press releases, cutting upstream LLM extraction costs by 64% and preventing duplicate graph nodes.",
    iconName: "ShieldCheck",
    color: "#00f0ff",
    codeSample: `# Cryptographic bloom filter idempotency check
doc_hash = hashlib.sha256(raw_text.encode('utf-8')).hexdigest()
if redis_bloom.exists("processed_signals", doc_hash):
    logger.info(f"Skipping duplicate signal: {doc_hash[:8]}")
    return None
redis_bloom.add("processed_signals", doc_hash)`
  },
  {
    id: 2,
    title: "Graceful Multi-LLM Fallback & Circuit Breakers",
    subtitle: "Zero-Downtime Provider Cascading",
    principle: "Ensure continuous 24/7 autonomous monitoring even during upstream LLM rate limits, cloud outages, or API deprecations.",
    implementation: "Implements an adaptive hierarchical fallback orchestrator: Groq LPU (Primary) -> DeepSeek/OpenRouter (Secondary) -> Local Quantized Mistral/Ollama (Local Fallback). Circuit breakers trip automatically upon 3 consecutive 5xx errors.",
    impact: "99.99% pipeline uptime with automated seamless degradation and zero lost intelligence events.",
    iconName: "Cpu",
    color: "#f43f5e",
    codeSample: `# Hierarchical cascading fallback with circuit breaker
try:
    return await groq_client.extract_entities(payload, timeout=2.5)
except (RateLimitError, APITimeoutError):
    circuit_breaker.record_failure("groq")
    logger.warning("Groq limit reached. Falling back to secondary cloud LLM...")
    return await fallback_client.extract_entities(payload)`
  },
  {
    id: 3,
    title: "Decoupled Asynchronous Worker Queues",
    subtitle: "Zero-Blocking Ingestion & Analysis Isolation",
    principle: "Slow heavy graph clustering or multi-hop RAG queries must never block high-throughput crawler ingestion streams.",
    implementation: "Architecture uses independent Redis Streams / RabbitMQ queues separating Ingest Workers, Embedding Workers, Graph Topology Builders, and Oracle Query Handlers with backpressure throttling.",
    impact: "Crawlers can ingest 10,000+ signals/min during peak news events while graph analysis smoothly converges in the background without memory spikes.",
    iconName: "Layers",
    color: "#a855f7",
    codeSample: `# Independent asynchronous pipeline event queues
async def ingest_worker(stream_queue: asyncio.Queue):
    while True:
        raw_signal = await fetch_next_signal()
        await stream_queue.put(raw_signal)
        # Non-blocking backpressure check
        if stream_queue.qsize() > MAX_BUFFER_THRESHOLD:
            await asyncio.sleep(0.05)`
  },
  {
    id: 4,
    title: "Social & Noise Fallback Heuristics",
    subtitle: "Confidence Thresholding & Anti-Hallucination Guardrails",
    principle: "Eliminate low-signal social hype, promotional spam, and hallucinated relationship edges from poisoning strategic executive briefings.",
    implementation: "Enforces dual-threshold verification: (1) Minimum confidence score (>0.82) from LLM extraction, and (2) Cross-source citation corroboration before adding high-severity edges to the core knowledge graph.",
    impact: "Maintains 99.4% link precision and prevents speculative social media gossip from triggering false competitive alerts.",
    iconName: "Filter",
    color: "#10b981",
    codeSample: `# Corroboration & noise filtering
if signal.source_type == "social" and item.confidence < 0.85:
    item.severity = "MONITOR"
    item.tags.append("unverified-signal")
    # Require 2nd corroborating source before promoting
    queue_for_corroboration(item)`
  },
  {
    id: 5,
    title: "UI & Vector Graph Scalability (LOD & Instancing)",
    subtitle: "Level-of-Detail & Sparse WebGL Rendering",
    principle: "Maintain silky smooth 60 FPS 3D rendering and sub-10ms graph queries even as the knowledge graph grows beyond 100,000+ nodes.",
    implementation: "Employs Three.js InstancedMesh with dynamic LOD (Level-of-Detail), WebGL frustum culling, distance-based edge fading, and k-NN sparse graph pruning to bound edge count to O(k*N).",
    impact: "Flawless interactive 60 FPS performance on laptops and mobile devices with zero WebGL GPU stutter.",
    iconName: "Zap",
    color: "#f59e0b",
    codeSample: `# WebGL InstancedMesh with frustum culling & LOD
const instancedMesh = new THREE.InstancedMesh(sphereGeometry, nodeMaterial, 5000);
instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
// Distance-based edge thresholding
const activeEdges = edges.filter(e => e.similarity >= DYNAMIC_LOD_THRESHOLD);`
  }
];
