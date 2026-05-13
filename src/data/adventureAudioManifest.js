import { publicAsset } from '../lib/publicAsset'

export const adventureAudio = {
  ambient: {
    castle: publicAsset('audio/duels/ambient/ambient_castle_night.mp3'),
    scanner: publicAsset('audio/duels/ambient/ambient_magic_wind.mp3'),
    reward: publicAsset('audio/duels/ambient/ambient_duel_hall.mp3'),
    tension: publicAsset('audio/duels/ambient/ambient_dungeon_low.mp3')
  },

  ui: {
    unlock: publicAsset('audio/duels/ui/ui_button_magic.mp3'),
    mapOpen: publicAsset('audio/duels/ui/ui_card_confirm.mp3'),
    magicClick: publicAsset('audio/duels/ui/ui_button_magic.mp3'),
    cameraStart: publicAsset('audio/duels/ui/ui_button_magic.mp3'),
    portalScan: publicAsset('audio/duels/ui/ui_card_confirm.mp3'),
    correct: publicAsset('audio/duels/ui/ui_reward.mp3'),
    wrong: publicAsset('audio/duels/ui/ui_timer_warning.mp3'),
    rewardFanfare: publicAsset('audio/duels/ui/ui_reward.mp3'),
    transition: publicAsset('audio/duels/ui/ui_button_magic.mp3')
  },

  home: {
    intro: publicAsset('audio/adventure/voices/home/intro.mp3'),
    activeAdventure: publicAsset('audio/adventure/voices/home/active_adventure.mp3'),
    blockedDaily: publicAsset('audio/adventure/voices/home/blocked_daily.mp3'),
    noRewards: publicAsset('audio/adventure/voices/home/intro.mp3') // Fallback as this file is missing
  },

  scanner: {
    instruction: publicAsset('audio/adventure/voices/scanner/instruction.mp3'),
    validPortal: publicAsset('audio/adventure/voices/scanner/valid_portal.mp3'),
    invalidQr: publicAsset('audio/adventure/voices/scanner/invalid_qr.mp3'),
    lookingForSeal: publicAsset('audio/adventure/voices/scanner/looking_for_seal.mp3')
  },

  reward: {
    completed: publicAsset('audio/adventure/voices/reward/completed.mp3'),
    showCode: publicAsset('audio/adventure/voices/reward/show_code.mp3'),
    alreadyRedeemed: publicAsset('audio/adventure/voices/reward/already_redeemed.mp3')
  },

  steps: {
    gryffindor_01: {
      intro: publicAsset('audio/adventure/voices/steps/gryffindor_01_intro.mp3'),
      question: publicAsset('audio/adventure/voices/steps/gryffindor_01_question.mp3'),
      success: publicAsset('audio/adventure/voices/steps/gryffindor_01_success.mp3'),
      fail: publicAsset('audio/adventure/voices/steps/gryffindor_01_fail.mp3')
    },
    slytherin_01: {
      intro: publicAsset('audio/adventure/voices/steps/slytherin_01_intro.mp3'),
      question: publicAsset('audio/adventure/voices/steps/slytherin_01_question.mp3'),
      success: publicAsset('audio/adventure/voices/steps/slytherin_01_success.mp3'),
      fail: publicAsset('audio/adventure/voices/steps/slytherin_01_fail.mp3')
    },
    great_hall_01: {
      intro: publicAsset('audio/adventure/voices/steps/great_hall_01_intro.mp3'),
      question: publicAsset('audio/adventure/voices/steps/great_hall_01_question.mp3'),
      success: publicAsset('audio/adventure/voices/steps/great_hall_01_success.mp3'),
      fail: publicAsset('audio/adventure/voices/steps/great_hall_01_fail.mp3')
    },
    diagon_01: {
      intro: publicAsset('audio/adventure/voices/steps/diagon_01_intro.mp3'),
      question: publicAsset('audio/adventure/voices/steps/diagon_01_question.mp3'),
      success: publicAsset('audio/adventure/voices/steps/diagon_01_success.mp3'),
      fail: publicAsset('audio/adventure/voices/steps/diagon_01_fail.mp3')
    },
    disney_01: {
      intro: publicAsset('audio/adventure/voices/steps/disney_01_intro.mp3'),
      question: publicAsset('audio/adventure/voices/steps/disney_01_question.mp3'),
      success: publicAsset('audio/adventure/voices/steps/disney_01_success.mp3'),
      fail: publicAsset('audio/adventure/voices/steps/disney_01_fail.mp3')
    }
  }
}

export function getStepAudio(step) {
  if (!step) return null

  const explicitKey = step.audio_key || step.audioKey
  if (explicitKey && adventureAudio.steps[explicitKey]) {
    return adventureAudio.steps[explicitKey]
  }

  const zoneAliases = {
    gryffindor: 'gryffindor',
    griffindor: 'gryffindor',
    slytherin: 'slytherin',
    gran_comedor: 'great_hall',
    great_hall: 'great_hall',
    comedor: 'great_hall',
    callejon_diagon: 'diagon',
    diagon: 'diagon',
    callejon: 'diagon',
    zona_disney: 'disney',
    disney: 'disney'
  }

  const rawZone =
    step.zone_slug ||
    step.zone ||
    step.zoneSlug ||
    step.zone_name ||
    step.zoneName ||
    step.location_slug ||
    step.location

  const normalizedZone = zoneAliases[String(rawZone || '').toLowerCase()] || String(rawZone || '').toLowerCase()
  const order = String(step.step_order || step.order || 1).padStart(2, '0')

  if (!normalizedZone) {
    return {
      intro: adventureAudio.home.intro,
      question: null,
      success: adventureAudio.ui.correct,
      fail: adventureAudio.ui.wrong
    }
  }

  const key = `${normalizedZone}_${order}`

  return adventureAudio.steps[key] ||
    adventureAudio.steps[`${normalizedZone}_01`] ||
    {
      intro: adventureAudio.home.intro,
      question: null,
      success: adventureAudio.ui.correct,
      fail: adventureAudio.ui.wrong
    }
}
