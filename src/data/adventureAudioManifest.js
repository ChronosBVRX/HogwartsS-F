export const adventureAudio = {
  ambient: {
    castle: '/audio/duels/ambient/ambient_castle_night.mp3',
    scanner: '/audio/duels/ambient/ambient_magic_wind.mp3',
    reward: '/audio/duels/ambient/ambient_duel_hall.mp3',
    tension: '/audio/duels/ambient/ambient_dungeon_low.mp3'
  },

  ui: {
    mapOpen: '/audio/duels/ui/ui_card_confirm.mp3',
    magicClick: '/audio/duels/ui/ui_button_magic.mp3',
    cameraStart: '/audio/duels/ui/ui_button_magic.mp3',
    portalScan: '/audio/duels/ui/ui_card_confirm.mp3',
    correct: '/audio/duels/ui/ui_reward.mp3',
    wrong: '/audio/duels/ui/ui_timer_warning.mp3',
    rewardFanfare: '/audio/duels/ui/ui_reward.mp3',
    transition: '/audio/duels/ui/ui_button_magic.mp3'
  },

  home: {
    intro: '/audio/adventure/voices/home/intro.mp3',
    activeAdventure: '/audio/adventure/voices/home/active_adventure.mp3',
    blockedDaily: '/audio/adventure/voices/home/blocked_daily.mp3',
    noRewards: '/audio/adventure/voices/home/no_rewards.mp3'
  },

  scanner: {
    instruction: '/audio/adventure/voices/scanner/instruction.mp3',
    validPortal: '/audio/adventure/voices/scanner/valid_portal.mp3',
    invalidQr: '/audio/adventure/voices/scanner/invalid_qr.mp3',
    lookingForSeal: '/audio/adventure/voices/scanner/looking_for_seal.mp3'
  },

  reward: {
    completed: '/audio/adventure/voices/reward/completed.mp3',
    showCode: '/audio/adventure/voices/reward/show_code.mp3',
    alreadyRedeemed: '/audio/adventure/voices/reward/already_redeemed.mp3'
  },

  steps: {
    gryffindor_01: {
      intro: '/audio/adventure/voices/steps/gryffindor_01_intro.mp3',
      question: '/audio/adventure/voices/steps/gryffindor_01_question.mp3',
      success: '/audio/adventure/voices/steps/gryffindor_01_success.mp3',
      fail: '/audio/adventure/voices/steps/gryffindor_01_fail.mp3'
    },
    slytherin_01: {
      intro: '/audio/adventure/voices/steps/slytherin_01_intro.mp3',
      question: '/audio/adventure/voices/steps/slytherin_01_question.mp3',
      success: '/audio/adventure/voices/steps/slytherin_01_success.mp3',
      fail: '/audio/adventure/voices/steps/slytherin_01_fail.mp3'
    },
    great_hall_01: {
      intro: '/audio/adventure/voices/steps/great_hall_01_intro.mp3',
      question: '/audio/adventure/voices/steps/great_hall_01_question.mp3',
      success: '/audio/adventure/voices/steps/great_hall_01_success.mp3',
      fail: '/audio/adventure/voices/steps/great_hall_01_fail.mp3'
    },
    diagon_01: {
      intro: '/audio/adventure/voices/steps/diagon_01_intro.mp3',
      question: '/audio/adventure/voices/steps/diagon_01_question.mp3',
      success: '/audio/adventure/voices/steps/diagon_01_success.mp3',
      fail: '/audio/adventure/voices/steps/diagon_01_fail.mp3'
    },
    disney_01: {
      intro: '/audio/adventure/voices/steps/disney_01_intro.mp3',
      question: '/audio/adventure/voices/steps/disney_01_question.mp3',
      success: '/audio/adventure/voices/steps/disney_01_success.mp3',
      fail: '/audio/adventure/voices/steps/disney_01_fail.mp3'
    }
  }
}

export function getStepAudio(step) {
  if (!step) return null

  const explicitKey = step.audio_key || step.audioKey
  if (explicitKey && adventureAudio.steps[explicitKey]) {
    return adventureAudio.steps[explicitKey]
  }

  const zone = step.zone_slug || step.zone || step.zoneSlug
  const order = String(step.step_order || step.order || 1).padStart(2, '0')

  if (!zone) return null

  const key = `${zone}_${order}`
  return adventureAudio.steps[key] || null
}
