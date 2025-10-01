import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const starterQuestions = [
  "What is our leave policy?",
  "How do I submit a ticket for IT support?", 
  "What are the company holidays this year?",
  "How do I update my personal information?",
  "What is the process for requesting time off?",
];

export const StarterQuestionsList = ({
  handleSend,
}: {
  handleSend: (question: string) => void;
}) => {
  return (
    <div className="w-full mt-8">
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto "> */}
      <div className="flex flex-row flex-wrap gap-3 justify-center">
        {starterQuestions.map((question, index) => (
          <Card
            key={question}
            className="bg-muted/30 cursor-pointer group transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:bg-muted/50 animate-fade-in-up p-4 border-border/30 backdrop-blur-sm"
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'backwards'
            }}
            onClick={() => handleSend(question)}
          >
            <div className="flex items-center gap-3">
              <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-primary transition-all duration-200 flex-shrink-0" />
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {question}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
