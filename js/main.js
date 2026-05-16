const FOCUS_DURATION = 50 * 60 * 1000
const BREAK_DURATION = 10 * 60 * 1000

// Stored outside Alpine so rAF writes don't trigger reactive re-renders
let _labelRaf = null
let _animStart = null
let _audioCtx = null

function timer() {
  return {
    state: 'ready',
    timeRemaining: 0,
    endTime: null,
    intervalId: null,
    pressTimer: null,
    isPressing: false,

    init() {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    },

    get bgClass() {
      return {
        ready: 'bg-stone-100 text-stone-800',
        focus: 'bg-violet-950 text-violet-100',
        break: 'bg-emerald-950 text-emerald-100',
      }[this.state]
    },

    startTickAnim(durationMs) {
      const deg = (durationMs / 3600000) * 360
      const group = this.$refs.tickGroup
      group.style.setProperty('--tick-from', `${deg}deg`)
      group.style.animation = 'none'
      document.body.offsetHeight
      group.style.animation = `tick-sweep ${durationMs}ms linear forwards`

      cancelAnimationFrame(_labelRaf)
      _animStart = performance.now()
      const label = this.$refs.tickLabel
      const frame = () => {
        const ms = Math.max(0, durationMs - (performance.now() - _animStart))
        const a = (ms / 3600000) * 2 * Math.PI
        // translate runs on compositor; left/top are fixed and never change
        const dx = (115.2 * Math.sin(a)).toFixed(2)
        const dy = (115.2 * (1 - Math.cos(a))).toFixed(2)
        label.style.translate = `calc(-50% + ${dx}px) calc(-50% + ${dy}px)`
        label.textContent = Math.floor(ms / 60000)
        if (ms > 0) _labelRaf = requestAnimationFrame(frame)
      }
      _labelRaf = requestAnimationFrame(frame)
    },

    stopTickAnim() {
      this.$refs.tickGroup.style.animation = 'none'
      cancelAnimationFrame(_labelRaf)
    },

    start() {
      this.state = 'focus'
      this.endTime = Date.now() + FOCUS_DURATION
      this.timeRemaining = FOCUS_DURATION
      this.intervalId = setInterval(() => this.tick(), 500)
      this.updateTitle()
      this.startTickAnim(FOCUS_DURATION)
    },

    tick() {
      this.timeRemaining = Math.max(0, this.endTime - Date.now())
      this.updateTitle()
      if (this.timeRemaining <= 0 && !this.isPressing) {
        this.state === 'focus'
          ? this.transitionToBreak()
          : this.transitionToReady()
      }
    },

    transitionToBreak() {
      clearInterval(this.intervalId)
      this.notify('Focus session complete — take a break.')
      this.state = 'break'
      this.endTime = Date.now() + BREAK_DURATION
      this.timeRemaining = BREAK_DURATION
      this.intervalId = setInterval(() => this.tick(), 500)
      this.startTickAnim(BREAK_DURATION)
    },

    transitionToReady() {
      clearInterval(this.intervalId)
      this.notify('Break over — ready for another session.')
      this.state = 'ready'
      this.timeRemaining = 0
      this.endTime = null
      this.updateTitle()
      this.stopTickAnim()
    },

    cancel() {
      clearInterval(this.intervalId)
      this.isPressing = false
      this.state = 'ready'
      this.timeRemaining = 0
      this.endTime = null
      this.updateTitle()
      this.stopTickAnim()
    },

    startPress() {
      this.isPressing = true
      this.pressTimer = setTimeout(() => this.cancel(), 1000)
    },

    endPress() {
      this.isPressing = false
      clearTimeout(this.pressTimer)
    },

    formatTime(ms) {
      const s = Math.floor(ms / 1000)
      const m = Math.floor(s / 60)
      const r = s % 60
      return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
    },

    updateTitle() {
      if (this.state === 'ready') {
        document.title = 'Focus Timer'
      } else {
        const label = this.state === 'focus' ? 'Focus' : 'Break'
        document.title = `${label} – ${this.formatTime(this.timeRemaining)}`
      }
    },

    notify(msg) {
      if (Notification.permission === 'granted') {
        new Notification('Focus Timer', { body: msg })
      }

      try {
        _audioCtx ??= new AudioContext()
        const ctx = _audioCtx
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 440
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 1)
      } catch (e) { }
    },
  }
}
