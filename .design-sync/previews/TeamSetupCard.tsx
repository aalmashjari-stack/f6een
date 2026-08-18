import { TeamSetupCard } from '@f6een/ui'

const stage = { background: 'var(--sh-night)', padding: 22, borderRadius: 18 }

/** شاشة الإعداد: بطاقتان متجاورتان، والبادئ يُعلَّم بالإطار لا بسطر نصّي. */
export const SetupPair = () => (
  <div dir="rtl" style={{ ...stage, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: 620 }}>
    <TeamSetupCard name="الصقور" players={['سالم', 'فهد']} starter />
    <TeamSetupCard name="النواخذة" players={['ناصر', 'عبدالله']} />
  </div>
)

/** فريق كبير — حتى ستة لاعبين. */
export const SixPlayers = () => (
  <div dir="rtl" style={{ ...stage, minWidth: 340 }}>
    <TeamSetupCard
      name="النواخذة"
      players={['ناصر', 'عبدالله', 'خالد', 'منيرة', 'سارة', 'عبدالرحمن']}
    />
  </div>
)
