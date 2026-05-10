import React, { useState, useRef } from 'react'
import { Shield, CheckCircle, XCircle, Star, Upload, Phone, Banknote, ArrowRight, X, Image } from 'lucide-react'
import ToastContainer from '../../components/Toast'
import EmptyState from '../../components/EmptyState'
import { useApi, useToast } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'
import { getSubscriptions, createSubscription, cancelSubscription } from '../../services/api'
import { useIsMobile } from '../../hooks/useIsMobile'

function getPlans() {
  try {
    const saved = JSON.parse(localStorage.getItem('subscription_plans') || 'null')
    if (saved) return saved
  } catch {}
  return [
    { id:1, name:'شهري',  name_en:'Monthly',    price:150,  duration:30,  popular:false, features_ar:['20 رحلة','أولوية الحجز'],                                              features_en:['20 trips','Priority booking'] },
    { id:2, name:'ربعي',  name_en:'Quarterly',  price:400,  duration:90,  popular:false, features_ar:['60 رحلة','أولوية الحجز','خصم 11%'],                                   features_en:['60 trips','Priority booking','11% off'] },
    { id:3, name:'سداسي', name_en:'Semi-Annual',price:720,  duration:180, popular:false, features_ar:['120 رحلة','أولوية الحجز','خصم 20%','دعم مميز'],                      features_en:['120 trips','Priority booking','20% off','Premium support'] },
    { id:4, name:'سنوي',  name_en:'Annual',     price:1200, duration:365, popular:true,  features_ar:['رحلات غير محدودة','أولوية الحجز','خصم 33%','دعم مميز','رحلات خاصة'], features_en:['Unlimited trips','Priority booking','33% off','Premium support','Special trips'] },
  ]
}

function getFeatures(plan, lang) {
  if (lang === 'ar') {
    if (Array.isArray(plan.features_ar) && plan.features_ar.length) return plan.features_ar
    if (typeof plan.features === 'string') return plan.features.split('\n').filter(Boolean)
    if (Array.isArray(plan.features)) return plan.features
  } else {
    if (Array.isArray(plan.features_en) && plan.features_en.length) return plan.features_en
    if (typeof plan.features === 'string') return plan.features.split('\n').filter(Boolean)
    if (Array.isArray(plan.features)) return plan.features
  }
  return []
}

const INSTAPAY_NUMBER = '01001234567'
const INSTAPAY_NAME   = 'UniBus - نظام النقل الجامعي'

function PaymentModal({ plan, lang, onClose, onConfirm }) {
  const [step, setStep]             = useState('choose')
  const [receipt, setReceipt]       = useState(null)
  const [preview, setPreview]       = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef()

  const price    = Number(plan.price).toLocaleString()
  const planName = lang === 'ar' ? plan.name : plan.name_en

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setReceipt(ev.target.result); setPreview(ev.target.result) }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(method) {
    setSubmitting(true)
    await onConfirm(plan, method, receipt)
    setSubmitting(false)
  }

  return (
    <div style={{ position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'var(--card-bg)',borderRadius:20,padding:32,maxWidth:480,width:'100%',position:'relative',boxShadow:'0 20px 60px rgba(0,0,0,0.4)',border:'1px solid var(--border)' }}>
        <button onClick={onClose} style={{ position:'absolute',top:16,left:16,background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',padding:4 }}>
          <X size={22}/>
        </button>

        <div style={{ textAlign:'center',marginBottom:24 }}>
          <div style={{ fontSize:14,color:'var(--text-muted)',marginBottom:4 }}>{lang==='ar'?'الاشتراك في باقة':'Subscribe to'}</div>
          <div style={{ fontSize:24,fontWeight:800,color:'var(--text-primary)' }}>{planName}</div>
          <div style={{ fontSize:32,fontWeight:900,color:'var(--calm)',marginTop:4 }}>
            {price} <span style={{ fontSize:16,fontWeight:500 }}>{lang==='ar'?'ج.م':'EGP'}</span>
          </div>
        </div>

        {step === 'choose' && (
          <>
            <div style={{ fontSize:15,fontWeight:700,marginBottom:14,color:'var(--text-secondary)',textAlign:'center' }}>
              {lang==='ar'?'اختر طريقة الدفع':'Choose payment method'}
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              <button onClick={()=>setStep('instapay')} style={{ display:'flex',alignItems:'center',gap:16,padding:'18px 20px',background:'linear-gradient(135deg,rgba(84,172,191,0.1),rgba(26,61,84,0.08))',border:'2px solid rgba(84,172,191,0.4)',borderRadius:14,cursor:'pointer',width:'100%' }}>
                <div style={{ width:48,height:48,borderRadius:12,background:'rgba(84,172,191,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <Phone size={24} color="var(--calm)"/>
                </div>
                <div style={{ flex:1,textAlign:'right' }}>
                  <div style={{ fontSize:17,fontWeight:700,color:'var(--text-primary)' }}>InstaPay</div>
                  <div style={{ fontSize:13,color:'var(--text-muted)',marginTop:2 }}>{lang==='ar'?'تحويل فوري + رفع إيصال':'Instant transfer + upload receipt'}</div>
                </div>
                <ArrowRight size={18} color="var(--text-muted)"/>
              </button>

              <button onClick={()=>setStep('cash')} style={{ display:'flex',alignItems:'center',gap:16,padding:'18px 20px',background:'linear-gradient(135deg,rgba(201,168,76,0.08),rgba(26,61,84,0.04))',border:'2px solid rgba(201,168,76,0.3)',borderRadius:14,cursor:'pointer',width:'100%' }}>
                <div style={{ width:48,height:48,borderRadius:12,background:'rgba(201,168,76,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <Banknote size={24} color="var(--amber)"/>
                </div>
                <div style={{ flex:1,textAlign:'right' }}>
                  <div style={{ fontSize:17,fontWeight:700,color:'var(--text-primary)' }}>{lang==='ar'?'كاش':'Cash'}</div>
                  <div style={{ fontSize:13,color:'var(--text-muted)',marginTop:2 }}>{lang==='ar'?'ادفع نقداً في المكتب':'Pay in-person at the office'}</div>
                </div>
                <ArrowRight size={18} color="var(--text-muted)"/>
              </button>
            </div>
          </>
        )}

        {step === 'instapay' && (
          <>
            <button onClick={()=>setStep('choose')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:13,marginBottom:16,display:'flex',alignItems:'center',gap:4 }}>
              ← {lang==='ar'?'رجوع':'Back'}
            </button>
            <div style={{ background:'linear-gradient(135deg,rgba(84,172,191,0.1),rgba(26,61,84,0.08))',border:'2px solid rgba(84,172,191,0.35)',borderRadius:16,padding:'20px 24px',marginBottom:20,textAlign:'center' }}>
              <div style={{ fontSize:13,color:'var(--text-muted)',marginBottom:6 }}>{lang==='ar'?'📲 حوّل المبلغ على رقم InstaPay':'📲 Transfer to InstaPay number'}</div>
              <div style={{ fontSize:26,fontWeight:900,color:'var(--calm)',letterSpacing:'2px',direction:'ltr',marginBottom:4 }}>{INSTAPAY_NUMBER}</div>
              <div style={{ fontSize:13,color:'var(--text-muted)' }}>{INSTAPAY_NAME}</div>
              <div style={{ marginTop:10,padding:'8px 16px',background:'rgba(84,172,191,0.12)',borderRadius:8,display:'inline-block' }}>
                <span style={{ fontSize:15,fontWeight:700,color:'var(--text-primary)' }}>{lang==='ar'?'المبلغ: ':'Amount: '}{price} {lang==='ar'?'ج.م':'EGP'}</span>
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:14,fontWeight:600,color:'var(--text-secondary)',marginBottom:10 }}>{lang==='ar'?'📎 ارفع صورة الإيصال':'📎 Upload payment receipt'}</div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }}/>
              {preview ? (
                <div style={{ position:'relative',borderRadius:12,overflow:'hidden',border:'2px solid rgba(84,172,191,0.4)' }}>
                  <img src={preview} alt="receipt" style={{ width:'100%',maxHeight:180,objectFit:'cover',display:'block' }}/>
                  <button onClick={()=>{ setReceipt(null); setPreview(null) }} style={{ position:'absolute',top:8,left:8,background:'rgba(0,0,0,0.6)',border:'none',borderRadius:8,padding:'4px 8px',color:'white',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12 }}>
                    <X size={14}/> {lang==='ar'?'حذف':'Remove'}
                  </button>
                </div>
              ) : (
                <button onClick={()=>fileRef.current.click()} style={{ width:'100%',padding:'20px',borderRadius:12,border:'2px dashed rgba(84,172,191,0.4)',background:'rgba(84,172,191,0.04)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:8,color:'var(--text-muted)' }}>
                  <Image size={28} color="var(--calm)"/>
                  <span style={{ fontSize:14 }}>{lang==='ar'?'اضغط لرفع صورة الإيصال':'Click to upload receipt image'}</span>
                  <span style={{ fontSize:12 }}>PNG / JPG</span>
                </button>
              )}
            </div>

            <button disabled={!receipt||submitting} onClick={()=>handleSubmit('instapay')} style={{ width:'100%',padding:'14px',borderRadius:12,border:'none',background:(!receipt||submitting)?'rgba(84,172,191,0.3)':'var(--calm)',color:'white',fontSize:16,fontWeight:700,cursor:(!receipt||submitting)?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
              {submitting ? <div style={{ width:20,height:20,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/> : <><Upload size={18}/> {lang==='ar'?'إرسال طلب الاشتراك':'Submit subscription request'}</>}
            </button>
            {!receipt && <div style={{ fontSize:12,color:'var(--text-muted)',textAlign:'center',marginTop:8 }}>{lang==='ar'?'* يجب رفع صورة الإيصال أولاً':'* Receipt upload required'}</div>}
          </>
        )}

        {step === 'cash' && (
          <>
            <button onClick={()=>setStep('choose')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:13,marginBottom:16,display:'flex',alignItems:'center',gap:4 }}>
              ← {lang==='ar'?'رجوع':'Back'}
            </button>
            <div style={{ background:'linear-gradient(135deg,rgba(201,168,76,0.08),rgba(26,61,84,0.04))',border:'2px solid rgba(201,168,76,0.3)',borderRadius:16,padding:'24px',marginBottom:20,textAlign:'center' }}>
              <Banknote size={40} color="var(--amber)" style={{ marginBottom:12 }}/>
              <div style={{ fontSize:16,fontWeight:700,color:'var(--text-primary)',marginBottom:8 }}>{lang==='ar'?'الدفع الكاش':'Cash Payment'}</div>
              <div style={{ fontSize:14,color:'var(--text-muted)',lineHeight:1.7 }}>
                {lang==='ar'
                  ? `توجه إلى مكتب إدارة النقل وادفع مبلغ ${price} ج.م نقداً لتفعيل باقة ${plan.name}.`
                  : `Visit the transportation office and pay ${price} EGP in cash to activate the ${plan.name_en} plan.`}
              </div>
              <div style={{ marginTop:16,padding:'10px 16px',background:'rgba(201,168,76,0.1)',borderRadius:10,fontSize:13,color:'var(--amber)',fontWeight:600 }}>
                ⏰ {lang==='ar'?'ساعات العمل: الأحد – الخميس 8ص – 4م':'Office hours: Sun – Thu 8AM – 4PM'}
              </div>
            </div>
            <button disabled={submitting} onClick={()=>handleSubmit('cash')} style={{ width:'100%',padding:'14px',borderRadius:12,border:'none',background:submitting?'rgba(201,168,76,0.3)':'var(--amber)',color:'white',fontSize:16,fontWeight:700,cursor:submitting?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
              {submitting ? <div style={{ width:20,height:20,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/> : <><CheckCircle size={18}/> {lang==='ar'?'تأكيد طلب الاشتراك':'Confirm subscription request'}</>}
            </button>
            <div style={{ fontSize:12,color:'var(--text-muted)',textAlign:'center',marginTop:8 }}>{lang==='ar'?'* سيتم تفعيل الاشتراك بعد تأكيد الدفع من الإدارة':'* Subscription activated after admin confirms payment'}</div>
          </>
        )}
      </div>
    </div>
  )
}

export default function StudentSubscription() {
  const isMobile = useIsMobile()
  const { t, lang }            = useLanguage()
  const { theme }              = useTheme()
  const { user }               = useAuth()
  const { data: subs, loading, refetch } = useApi(getSubscriptions)
  const { toasts, showToast }  = useToast()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const isDark = theme === 'dark'
  const plans  = getPlans()

  const activeSub = (subs||[]).find(s =>
    (s.status === 'active' || s.status === 'pending_review' || s.status === 'pending_payment') &&
    (s.student === user?.user_name || s.userId === String(user?.id))
  )
  // Only block new subscription if truly active — pending subs still allow re-submitting
  const blockNewSub = activeSub?.status === 'active'

  const handleSubscribe = async (plan, method, receipt) => {
    const today = new Date()
    const end   = new Date(today)
    end.setDate(end.getDate() + plan.duration)
    try {
      await createSubscription({
        student: user?.user_name, userId: String(user?.id),
        plan: plan.name_en, plan_ar: plan.name,
        start_date: today.toISOString().split('T')[0],
        end_date:   end.toISOString().split('T')[0],
        status: method === 'cash' ? 'pending_payment' : 'pending_review',
        price: plan.price, payment_method: method, receipt_image: receipt || null,
      })
      showToast(lang==='ar'
        ? method==='instapay' ? `✅ تم إرسال طلب الاشتراك — في انتظار مراجعة الإيصال` : `✅ تم تسجيل طلب الاشتراك — يرجى الدفع في المكتب`
        : method==='instapay' ? `✅ Request sent — pending receipt review` : `✅ Request submitted — please pay at the office`)
      refetch()
    } catch { showToast(t('save_fail'), 'error') }
    setSelectedPlan(null)
  }

  const handleCancel = async () => {
    if (!activeSub) return
    if (!confirm(lang==='ar'?'إلغاء الاشتراك؟':'Cancel subscription?')) return
    try { await cancelSubscription(activeSub.id); showToast(lang==='ar'?'تم إلغاء الاشتراك':'Subscription cancelled'); refetch() }
    catch { showToast(t('save_fail'), 'error') }
  }

  if (loading) return (
    <div style={{ padding:40 }}>
      {Array(4).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height:200,borderRadius:14,marginBottom:14 }}/>)}
    </div>
  )

  return (
    <div style={{ padding: isMobile ? '16px 14px' : '28px 24px',maxWidth:900,margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>
      {selectedPlan && <PaymentModal plan={selectedPlan} lang={lang} onClose={()=>setSelectedPlan(null)} onConfirm={handleSubscribe}/>}

      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:20,fontWeight:800 }}>{t('my_subscription')}</h2>
        <p style={{ fontSize:14,color:'var(--text-muted)',marginTop:3 }}>{t('subscription_details')}</p>
      </div>

      {activeSub && (
        <div style={{ padding:'18px 20px',background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:14,marginBottom:28,display:'flex',alignItems:'center',gap:16 }}>
          <div style={{ width:48,height:48,borderRadius:12,background:'rgba(16,185,129,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <Shield size={28} color="#34d399"/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18,fontWeight:700,color:'#34d399' }}>
              {activeSub.status==='pending_review' ? (lang==='ar'?'⏳ في انتظار مراجعة الإيصال':'⏳ Pending receipt review')
               : activeSub.status==='pending_payment' ? (lang==='ar'?'⏳ في انتظار الدفع':'⏳ Pending payment')
               : `${t('subscription_active')} ✅`}
            </div>
            <div style={{ fontSize:14,color:'var(--text-muted)',marginTop:3 }}>
              {lang==='ar'?'الباقة: ':'Plan: '}<strong style={{ color:'var(--text-primary)' }}>{lang==='ar'?(activeSub.plan_ar||activeSub.plan):activeSub.plan}</strong>
              {' · '}{lang==='ar'?'الدفع: ':'Payment: '}<strong style={{ color:'var(--text-primary)' }}>
                {activeSub.payment_method==='instapay'?'InstaPay':activeSub.payment_method==='cash'?(lang==='ar'?'كاش':'Cash'):'—'}
              </strong>
              {activeSub.status==='active' && <>{' · '}{lang==='ar'?'ينتهي: ':'Expires: '}<strong style={{ color:'var(--text-primary)' }}>{activeSub.end_date}</strong></>}
            </div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleCancel}><XCircle size={17}/> {lang==='ar'?'إلغاء':'Cancel'}</button>
        </div>
      )}

      {plans.length===0 && <EmptyState icon={Shield} message={lang==='ar'?'لا توجد باقات متاحة حالياً':'No plans available yet'}/>}

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20 }}>
        {plans.map(plan => {
          const isActive = activeSub?.plan_ar===plan.name || activeSub?.plan===plan.name_en
          const feats    = getFeatures(plan, lang)
          return (
            <div key={plan.id} className="card" style={{ padding:28,position:'relative',overflow:'hidden',display:'flex',flexDirection:'column',background:isDark?'var(--card-bg)':'rgba(255,255,255,0.97)',boxShadow:isActive?'0 4px 24px rgba(16,185,129,0.25)':'0 2px 16px rgba(38,101,140,0.12)',border:isActive?'2px solid #34d399':'2px solid var(--border)' }}>
              {plan.popular && (
                <div style={{ position:'absolute',top:14,left:14,padding:'5px 12px',background:'rgba(201,168,76,0.2)',border:'1px solid rgba(201,168,76,0.4)',borderRadius:20,fontSize:16,fontWeight:700,color:'var(--amber)',display:'flex',alignItems:'center',gap:5 }}>
                  <Star size={16}/> {lang==='ar'?'الأكثر شيوعاً':'Most Popular'}
                </div>
              )}
              <div style={{ width:56,height:56,borderRadius:14,background:isDark?'rgba(38,101,140,0.25)':'rgba(38,101,140,0.10)',border:'1px solid rgba(38,101,140,0.25)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:18,marginTop:plan.popular?22:0 }}>
                <Shield size={28} color="var(--calm)"/>
              </div>
              <div style={{ fontSize:20,fontWeight:800,marginBottom:6,color:'var(--text-primary)' }}>{lang==='ar'?plan.name:plan.name_en}</div>
              <div style={{ fontSize:34,fontWeight:900,color:'var(--text-primary)',marginBottom:4,lineHeight:1 }}>
                {Number(plan.price).toLocaleString()}<span style={{ fontSize:19,color:'var(--text-muted)',fontWeight:500,marginRight:6 }}>{lang==='ar'?'ج.م':'EGP'}</span>
              </div>
              <div style={{ fontSize:18,color:'var(--text-muted)',marginBottom:18 }}>{plan.duration} {lang==='ar'?'يوم':'days'}</div>
              <div style={{ display:'flex',flexDirection:'column',gap:10,flex:1,marginBottom:18 }}>
                {feats.map((f,i) => (
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:10,fontSize:18,color:'var(--text-secondary)' }}>
                    <CheckCircle size={20} color="var(--calm)"/> {f}
                  </div>
                ))}
              </div>
              {isActive ? (
                <div style={{ width:'100%',padding:'14px 0',textAlign:'center',background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:10,fontSize:19,fontWeight:700,color:'#34d399' }}>
                  ✅ {lang==='ar'?'اشتراكك الحالي':'Current Plan'}
                </div>
              ) : (
                <button disabled={blockNewSub} onClick={()=>!blockNewSub&&setSelectedPlan(plan)} style={{ width:'100%',padding:'14px 0',borderRadius:10,border:'none',cursor:blockNewSub?'not-allowed':'pointer',background:blockNewSub?'rgba(30,107,140,0.3)':'linear-gradient(135deg,var(--calm),#1E5278)',color:'#ffffff',fontSize:19,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:blockNewSub?0.5:1,textShadow:'0 1px 3px rgba(0,0,0,0.35)',boxShadow:blockNewSub?'none':'0 4px 18px rgba(30,107,140,0.4)' }}>
                  <Shield size={17}/> {lang==='ar'?'اشترك الآن':'Subscribe Now'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
