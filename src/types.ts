export interface Question {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface Round {
  round: number;
  title: string;
  boringQuip: string;
  clearQuip: string;
  questions: Question[];
}

export interface QuestionBank {
  rounds: Round[];
}
