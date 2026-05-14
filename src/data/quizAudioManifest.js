
import { publicAsset } from '../lib/publicAsset'

export const quizAudio = {
  ui: {
    unlock: publicAsset('audio/duels/ui/ui_button_magic.mp3'),
    magicClick: publicAsset('audio/duels/ui/ui_button_magic.mp3'),
    thinking: publicAsset('audio/duels/ui/ui_card_select.mp3'),
    reveal: publicAsset('audio/duels/ui/ui_reward.mp3')
  },
  welcome: {
    intro: publicAsset('audio/quiz/sorting_hat/welcome/intro.mp3'),
    start: publicAsset('audio/quiz/sorting_hat/welcome/start.mp3')
  },
  questions: [
    {
      intro: publicAsset('audio/quiz/sorting_hat/questions/q01_intro.mp3'),
      question: publicAsset('audio/quiz/sorting_hat/questions/q01_question.mp3'),
      afterAnswer: publicAsset('audio/quiz/sorting_hat/questions/q01_after_answer.mp3')
    },
    {
      intro: publicAsset('audio/quiz/sorting_hat/questions/q02_intro.mp3'),
      question: publicAsset('audio/quiz/sorting_hat/questions/q02_question.mp3'),
      afterAnswer: publicAsset('audio/quiz/sorting_hat/questions/q02_after_answer.mp3')
    },
    {
      intro: publicAsset('audio/quiz/sorting_hat/questions/q03_intro.mp3'),
      question: publicAsset('audio/quiz/sorting_hat/questions/q03_question.mp3'),
      afterAnswer: publicAsset('audio/quiz/sorting_hat/questions/q03_after_answer.mp3')
    },
    {
      intro: publicAsset('audio/quiz/sorting_hat/questions/q04_intro.mp3'),
      question: publicAsset('audio/quiz/sorting_hat/questions/q04_question.mp3'),
      afterAnswer: publicAsset('audio/quiz/sorting_hat/questions/q04_after_answer.mp3')
    },
    {
      intro: publicAsset('audio/quiz/sorting_hat/questions/q05_intro.mp3'),
      question: publicAsset('audio/quiz/sorting_hat/questions/q05_question.mp3'),
      afterAnswer: publicAsset('audio/quiz/sorting_hat/questions/q05_after_answer.mp3')
    },
    {
      intro: publicAsset('audio/quiz/sorting_hat/questions/q06_intro.mp3'),
      question: publicAsset('audio/quiz/sorting_hat/questions/q06_question.mp3'),
      afterAnswer: publicAsset('audio/quiz/sorting_hat/questions/q06_after_answer.mp3')
    },
    {
      intro: publicAsset('audio/quiz/sorting_hat/questions/q07_intro.mp3'),
      question: publicAsset('audio/quiz/sorting_hat/questions/q07_question.mp3'),
      afterAnswer: publicAsset('audio/quiz/sorting_hat/questions/q07_after_answer.mp3')
    },
    {
      intro: publicAsset('audio/quiz/sorting_hat/questions/q08_intro.mp3'),
      question: publicAsset('audio/quiz/sorting_hat/questions/q08_question.mp3'),
      afterAnswer: publicAsset('audio/quiz/sorting_hat/questions/q08_after_answer.mp3')
    },
    {
      intro: publicAsset('audio/quiz/sorting_hat/questions/q09_intro.mp3'),
      question: publicAsset('audio/quiz/sorting_hat/questions/q09_question.mp3'),
      afterAnswer: publicAsset('audio/quiz/sorting_hat/questions/q09_after_answer.mp3')
    },
    {
      intro: publicAsset('audio/quiz/sorting_hat/questions/q10_intro.mp3'),
      question: publicAsset('audio/quiz/sorting_hat/questions/q10_question.mp3'),
      afterAnswer: publicAsset('audio/quiz/sorting_hat/questions/q10_after_answer.mp3')
    }
  ],
  sorting: {
    start: publicAsset('audio/quiz/sorting_hat/sorting/start.mp3'),
    line01: publicAsset('audio/quiz/sorting_hat/sorting/line_01.mp3'),
    line02: publicAsset('audio/quiz/sorting_hat/sorting/line_02.mp3'),
    line03: publicAsset('audio/quiz/sorting_hat/sorting/line_03.mp3'),
    final: publicAsset('audio/quiz/sorting_hat/sorting/final.mp3')
  },
  results: {
    red: publicAsset('audio/quiz/sorting_hat/results/gryffindor.mp3'),
    green: publicAsset('audio/quiz/sorting_hat/results/slytherin.mp3'),
    blue: publicAsset('audio/quiz/sorting_hat/results/ravenclaw.mp3'),
    yellow: publicAsset('audio/quiz/sorting_hat/results/hufflepuff.mp3')
  }
}
