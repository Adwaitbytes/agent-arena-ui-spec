"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { StepForward, Bot, Sparkles, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const steps = [
  {
    id: 1,
    title: "Agent Personality",
    description: "Define your agent's core traits and style."
  },
  {
    id: 2,
    title: "Prompt Crafting",
    description: "Build the system prompt that powers your agent."
  },
  {
    id: 3,
    title: "Memory & Refinements",
    description: "Add memory snippets and optional refinements."
  },
  {
    id: 4,
    title: "Preview & Launch",
    description: "Review and deploy your agent to battle!"
  }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    personality: "",
    prompt: "",
    memory: ["", "", ""], // 3 slots
    refinements: ["", "", ""] // 3 optional
  });
  const [preview, setPreview] = useState("");

  const updateForm = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final submission
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: formData.name,
          promptProfile: formData.prompt,
          personality: formData.personality,
          memorySnippets: formData.memory.filter(m => m.trim()),
          refinements: formData.refinements.filter(r => r.trim())
        })
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Agent created! Let's battle!");
        window.location.href = `/agent?created=1`;
      } else {
        toast.error(json.error || "Failed to create agent");
      }
    } catch (e) {
      toast.error("Submission failed");
    }
  };

  const stepContent = [
    // Step 1: Personality
    <div key={1} className="space-y-4">
      <Input
        placeholder="Agent Name (e.g., Witty Warrior)"
        value={formData.name}
        onChange={(e) => updateForm("name", e.target.value)}
        className="text-lg"
      />
      <Textarea
        placeholder="Describe your agent's personality in 1-2 sentences (e.g., 'A sarcastic comedian who loves puns and quick wit.')"
        value={formData.personality}
        onChange={(e) => updateForm("personality", e.target.value)}
        rows={3}
      />
      <div className="grid grid-cols-3 gap-2 text-sm">
        {["Sarcastic", "Formal", "Creative", "Logical", "Humorous", "Aggressive"].map((trait, i) => (
          <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-accent/50">
            {trait}
          </Badge>
        ))}
      </div>
    </div>,

    // Step 2: Prompt
    <div key={2} className="space-y-4">
      <Textarea
        placeholder="System Prompt (e.g., 'You are a duel master. Respond concisely, wittily, and directly to challenges.')"
        value={formData.prompt}
        onChange={(e) => updateForm("prompt", e.target.value)}
        rows={6}
      />
      <div className="text-xs text-muted-foreground">
        Tip: Be specific about response style, length, and tone. Keep under 500 characters for best results.
      </div>
      <div className="flex gap-2 text-sm">
        <span className="flex items-center gap-1">
          <Sparkles className="size-3" /> Example: "Respond as a pirate captain"
        </span>
      </div>
    </div>,

    // Step 3: Memory & Refinements
    <div key={3} className="space-y-6">
      <div>
        <h3 className="font-medium mb-2 flex items-center gap-2">Memory Snippets</h3>
        <p className="text-sm text-muted-foreground mb-3">3 key facts your agent remembers (e.g., past battles, preferences)</p>
        {formData.memory.map((m, i) => (
          <Input
            key={i}
            placeholder={`Snippet ${i+1} (e.g., "Hates losing to bots")`}
            value={m}
            onChange={(e) => {
              const newMemory = [...formData.memory];
              newMemory[i] = e.target.value;
              updateForm("memory", newMemory);
            }}
            className="mb-2"
          />
        ))}
      </div>
      <div>
        <h3 className="font-medium mb-2 flex items-center gap-2">Prompt Refinements</h3>
        <p className="text-sm text-muted-foreground mb-3">Optional tweaks for specific arenas</p>
        {formData.refinements.map((r, i) => (
          <Input
            key={i}
            placeholder={`Refinement ${i+1} (optional)`}
            value={r}
            onChange={(e) => {
              const newRef = [...formData.refinements];
              newRef[i] = e.target.value;
              updateForm("refinements", newRef);
            }}
            className="mb-2"
          />
        ))}
      </div>
    </div>,

    // Step 4: Preview
    <div key={4} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="size-5" /> Agent Preview: {formData.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <strong>Personality:</strong> {formData.personality || "Not set"}
          </div>
          <div className="text-xs space-y-1">
            <strong>System Prompt:</strong>
            <p className="font-mono bg-muted/50 p-3 rounded text-sm">{formData.prompt.substring(0, 200)}{formData.prompt.length > 200 ? "..." : ""}</p>
          </div>
          {formData.memory.some(m => m.trim()) && (
            <div>
              <strong>Memory:</strong>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.memory.filter(m => m.trim()).map((m, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{m}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">Your agent is ready! {formData.name} will battle with wit and strategy.</p>
      </div>
    </div>
  ];

  const stepProgress = currentStep + 1;
  const isComplete = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 flex items-center justify-center py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full mx-auto"
      >
        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              className={`flex items-center gap-2 ${i <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`size-3 rounded-full ${i === currentStep ? 'bg-chart-4 ring-2 ring-chart-4/30' : i < currentStep ? 'bg-chart-4' : 'bg-muted'}`} />
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < currentStep ? 'bg-chart-4' : 'bg-muted'}`} />
              )}
              <span className="text-sm font-medium hidden sm:block">{step.title}</span>
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden shadow-xl">
              <CardHeader className="bg-gradient-to-r from-chart-4 to-chart-3 text-background/90 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{steps[currentStep].title}</h2>
                    <p className="text-sm opacity-90">{steps[currentStep].description}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Step {stepProgress} of {steps.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 lg:p-8">
                {stepContent[currentStep]}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          className="flex justify-between mt-8 gap-4 pt-6 border-t border-border/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <StepForward className="h-4 w-4 rotate-180 mr-2" />
            Previous
          </Button>
          <Button
            onClick={nextStep}
            disabled={!formData.name && currentStep === 0}
            className={`flex-1 ${isComplete ? 'bg-gradient-to-r from-chart-4 to-chart-3 hover:from-chart-4/90 shadow-lg shadow-chart-4/20' : ''}`}
          >
            {isComplete ? (
              <>
                <Crown className="mr-2 h-4 w-4" />
                Launch Agent
              </>
            ) : (
              <>
                <StepForward className="mr-2 h-4 w-4" />
                Next Step
              </>
            )}
          </Button>
        </motion.div>

        {/* Progress Indicator */}
        <div className="mt-6 text-center">
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div 
              className="bg-chart-4 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground">{stepProgress} / {steps.length} Steps</span>
        </div>

        {/* Skip/Exit Option */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Skip Onboarding → Explore Arenas
          </Link>
        </div>
      </motion.div>
    </div>
  );
}