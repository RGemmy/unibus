import React, { useState } from 'react'
import { Plus, Shield, Edit2, Trash2, Save, Star } from 'lucide-react'
import Modal from '../../components/Modal'
import ToastContainer from '../../components/Toast'
import { useToast } from '../../hooks/useApi'
import { useLanguage } from '../../context/LanguageContext'
import { useIsMobile } from '../../hooks/useIsMobile'

const DEFAULT_PLANS = [
  { id:1, name:'شهري',    name_en:'Monthly',    price:150,  duration:30,  color:'blue',  popular:false, features:'20 رحلة\nأولوية الحجز' },
  { id:2, name:'ربعي',    name_en:'Quarterly',  price:400,  duration:90,  color:'teal',  popular:false, features:'60 رحلة\nأولوية الحجز\nخصم 11%' },
  { id:3, name:'سداسي',   name_en:'Semi-Annual',price:720,  duration:180, color:'amber', popular:false, features:'120 رحلة\nأولوية الحجز\nخصم 20%\nدعم مميز' },
  { id:4, name:'سنوي',    name_en:'Annual',     price:1200, duration:365, color:'green', popular:true,  features:'رحلات غير محدودة\nأولوية الحجز\nخصم 33%\nدعم مميز\nرحلات خاصة' },
]

function loadPlans() {
  try { return JSON.parse(localStorage.getItem('subscription_plans') || 'null') || DEFAULT_PLANS } catch { return DEFAULT_PLANS }
}
function savePlans(plans) { localStorage.setItem('subscription_plans', JSON.stringify(plans)) }

const colorOpts = ['blue','teal','amber','green']
const emptyForm = { name:'', name_en:'', price:100, duration:30, color:'blue', popular:false, features:'' }

export default function BusModPlans() {
  const isMobile = useIsMobile()
  const { t, lang } = useLanguage()
  const { toasts, showToast } = useToast()
  const [plans,  setPlans]  = useState(loadPlans)
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState(emptyForm)
  const [editId, setEditId] = useState(null)

  const openAdd  = () => { setForm(emptyForm); setEditId(null); setModal('form') }
  const openEdit = (p) => { setForm({ ...p, features: Array.isArray(p.features) ? p.features.join('\n') : p.features }); setEditId(p.id); setModal('form') }

  const handleSave = (e) => {
    e.preventDefault()
    const feats = form.features.split('\n').map(s=>s.trim()).filter(Boolean)
    const plan  = { ...form, features: feats, price: Number(form.price), duration: Number(form.duration) }
    let updated
    if (editId) {
      plan.id = editId
      updated = plans.map(p => p.id === editId ? plan : p)
    } else {
      plan.id = Date.now()
      updated  = [...plans, plan]
    }
    setPlans(updated); savePlans(updated)
    showToast(lang==='ar'?'تم حفظ الباقة':'Plan saved'); setModal(null)
  }

  const handleDelete = (id) => {
    if (!confirm(lang==='ar'?'حذف هذه الباقة؟':'Delete this plan?')) return
    const updated = plans.filter(p => p.id !== id)
    setPlans(updated); savePlans(updated)
    showToast(lang==='ar'?'تم حذف الباقة':'Plan deleted')
  }

  const colorMap = {
    blue:'var(--blue-light)', teal:'var(--blue-light)', amber:'var(--amber)', green:'#34d399'
  }

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px', maxWidth:1100, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:800 }}>{lang==='ar'?'إدارة باقات الاشتراك':'Subscription Plans'}</h2>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginTop:3 }}>
            {lang==='ar'?'الباقات التي يراها الطلاب عند الاشتراك — بالجنيه المصري':'Plans shown to students — priced in EGP'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={20}/> {lang==='ar'?'إضافة باقة':'Add Plan'}</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:20, alignItems:'stretch' }}>
        {plans.map(plan => {
          const feats = Array.isArray(plan.features) ? plan.features : plan.features.split('\n').filter(Boolean)
          const iconColor = colorMap[plan.color] || 'var(--matcha)'
          return (
            <div key={plan.id} className="card" style={{ display:"flex", flexDirection:"column", padding:26 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <Shield size={30} color={iconColor}/>
                  <div>
                    <div style={{ fontSize:20, fontWeight:700 }}>{lang==='ar'?plan.name:plan.name_en}</div>
                    <div style={{ fontSize:18, color:'var(--text-muted)' }}>{plan.duration} {lang==='ar'?'يوم':'days'}</div>
                  </div>
                </div>
                {plan.popular && <Star size={24} color="var(--amber)" fill="var(--amber)"/>}
              </div>
              <div style={{ fontSize:30, fontWeight:800, color:'var(--text-primary)', marginBottom:14 }}>
                <span style={{ color:'var(--text-primary)' }}>{Number(plan.price).toLocaleString()}</span>{' '}
                <span style={{ fontSize:19, color:'var(--text-primary)', fontWeight:600 }}>{lang==='ar'?'ج.م':'EGP'}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, flex:1, marginBottom:16 }}>
                {feats.slice(0,3).map((f,i)=>(
                  <div key={i} style={{ fontSize:18, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:iconColor, flexShrink:0 }}/>{f}
                  </div>
                ))}
                {feats.length > 3 && <div style={{ fontSize:17, color:'var(--text-muted)' }}>+{feats.length-3} {lang==='ar'?'أخرى':'more'}</div>}
              </div>
              <div style={{ display:'flex', gap:10, marginTop:'auto', paddingTop:14 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex:1 }} onClick={()=>openEdit(plan)}><Edit2 size={20}/> {t('edit_btn')}</button>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(plan.id)}><Trash2 size={20}/></button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal isOpen={modal==='form'} onClose={()=>setModal(null)} title={editId?(lang==='ar'?'تعديل باقة':'Edit Plan'):(lang==='ar'?'إضافة باقة':'Add Plan')}>
        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14 }}>
            <div className="form-group">
              <label className="form-label">{lang==='ar'?'الاسم بالعربي':'Name (Arabic)'}</label>
              <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="شهري"/>
            </div>
            <div className="form-group">
              <label className="form-label">{lang==='ar'?'الاسم بالإنجليزي':'Name (English)'}</label>
              <input className="form-input" value={form.name_en} onChange={e=>setForm({...form,name_en:e.target.value})} required placeholder="Monthly"/>
            </div>
            <div className="form-group">
              <label className="form-label">{lang==='ar'?'السعر (ج.م)':'Price (EGP)'}</label>
              <input type="number" className="form-input" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} min="1" required/>
            </div>
            <div className="form-group">
              <label className="form-label">{lang==='ar'?'المدة (أيام)':'Duration (days)'}</label>
              <input type="number" className="form-input" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} min="1" required/>
            </div>
            <div className="form-group">
              <label className="form-label">{lang==='ar'?'اللون':'Color'}</label>
              <select className="form-input" value={form.color} onChange={e=>setForm({...form,color:e.target.value})}>
                {colorOpts.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ display:'flex', alignItems:'center', gap:10, paddingTop:22 }}>
              <input type="checkbox" id="popular" checked={form.popular} onChange={e=>setForm({...form,popular:e.target.checked})} style={{ width:16, height:16, cursor:'pointer' }}/>
              <label htmlFor="popular" style={{ fontSize:16, cursor:'pointer' }}>{lang==='ar'?'الأكثر شيوعاً':'Most Popular'}</label>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{lang==='ar'?'المميزات (سطر لكل ميزة)':'Features (one per line)'}</label>
            <textarea className="form-input" value={form.features} onChange={e=>setForm({...form,features:e.target.value})} rows={4} style={{ resize:'vertical' }} placeholder={lang==='ar'?'20 رحلة\nأولوية الحجز':'20 trips\nPriority booking'}/>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary"><Save size={18}/> {t('save_changes')}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
