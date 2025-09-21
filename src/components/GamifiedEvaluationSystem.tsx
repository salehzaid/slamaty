import React, { useState, useEffect } from 'react'
import { 
  Trophy, 
  Star, 
  Award, 
  Target, 
  Zap, 
  Flame, 
  Crown, 
  Medal,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Gift,
  Plus,
  Link
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useEvaluation } from '../context/EvaluationContext'

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  points: number
  unlocked: boolean
  unlockedAt?: string
  category: 'creation' | 'completion' | 'optimization' | 'collaboration'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface UserStats {
  level: number
  experience: number
  experienceToNext: number
  totalPoints: number
  streak: number
  achievements: Achievement[]
  weeklyGoal: number
  weeklyProgress: number
  rank: number
  totalUsers: number
}

interface Challenge {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'monthly'
  reward: number
  progress: number
  target: number
  completed: boolean
  expiresAt: string
}

const GamifiedEvaluationSystem: React.FC = () => {
  const { categories, items, addItem, addCategory } = useEvaluation()
  const [userStats, setUserStats] = useState<UserStats>({
    level: 1,
    experience: 0,
    experienceToNext: 500,
    totalPoints: 0,
    streak: 0,
    achievements: [],
    weeklyGoal: 5,
    weeklyProgress: 0,
    rank: 1,
    totalUsers: 1
  })

  const [showNotification, setShowNotification] = useState<{message: string, points: number} | null>(null)

  // TODO: Replace with API call to get challenges from database
  const [challenges, setChallenges] = useState<Challenge[]>([])

  const [achievements] = useState<Achievement[]>([
    {
      id: 'first-item',
      title: 'البداية',
      description: 'أضف أول عنصر تقييم',
      icon: <Star className="w-6 h-6" />,
      points: 100,
      unlocked: true,
      unlockedAt: '2024-01-15T10:30:00Z',
      category: 'creation',
      rarity: 'common'
    },
    {
      id: 'category-master',
      title: 'سيد التصنيفات',
      description: 'أنشئ 5 تصنيفات مختلفة',
      icon: <Target className="w-6 h-6" />,
      points: 300,
      unlocked: true,
      unlockedAt: '2024-01-18T14:20:00Z',
      category: 'creation',
      rarity: 'rare'
    },
    {
      id: 'perfectionist',
      title: 'الكمالي',
      description: 'أكمل 10 عناصر بوزن 10',
      icon: <Crown className="w-6 h-6" />,
      points: 500,
      unlocked: false,
      category: 'optimization',
      rarity: 'epic'
    },
    {
      id: 'streak-master',
      title: 'سيد الاستمرارية',
      description: 'استخدم النظام لمدة 30 يوم متتالية',
      icon: <Flame className="w-6 h-6" />,
      points: 750,
      unlocked: false,
      category: 'completion',
      rarity: 'legendary'
    }
  ])

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'text-gray-600 bg-gray-100',
      rare: 'text-blue-600 bg-blue-100',
      epic: 'text-purple-600 bg-purple-100',
      legendary: 'text-yellow-600 bg-yellow-100'
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getLevelColor = (level: number) => {
    if (level < 5) return 'text-gray-600'
    if (level < 10) return 'text-blue-600'
    if (level < 15) return 'text-purple-600'
    return 'text-yellow-600'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-600" />
    if (rank <= 3) return <Trophy className="w-5 h-5 text-yellow-600" />
    if (rank <= 10) return <Medal className="w-5 h-5 text-gray-600" />
    return <Star className="w-5 h-5 text-gray-400" />
  }

  const calculateWeeklyProgress = () => {
    // حساب العناصر المضافة هذا الأسبوع
    const completedItems = items.filter(item => {
      const createdAt = new Date(item.createdAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return createdAt > weekAgo
    }).length
    
    return Math.min(completedItems, userStats.weeklyGoal)
  }

  // تحديث الإحصائيات بناءً على البيانات الحقيقية
  useEffect(() => {
    const progress = calculateWeeklyProgress()
    const totalPoints = achievements
      .filter(achievement => achievement.unlocked)
      .reduce((sum, achievement) => sum + achievement.points, 0)
    
    setUserStats(prev => ({
      ...prev,
      weeklyProgress: progress,
      totalPoints: totalPoints,
      level: Math.floor(totalPoints / 500) + 1,
      experience: totalPoints % 500,
      experienceToNext: 500
    }))
  }, [items, achievements])


  // دالة لإضافة تصنيف جديد والحصول على نقاط
  const handleAddCategory = async () => {
    const newCategory = {
      name: 'تصنيف جديد',
      color: 'blue'
    }
    
    try {
      await addCategory(newCategory)
      
      // إضافة نقاط
      setUserStats(prev => ({
        ...prev,
        totalPoints: prev.totalPoints + 100,
        experience: prev.experience + 100
      }))
      
      // إظهار إشعار
      setShowNotification({message: 'تم إضافة تصنيف جديد!', points: 100})
      setTimeout(() => setShowNotification(null), 3000)
      
    } catch (error) {
      console.error('فشل في إضافة التصنيف:', error)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen relative">
      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
          <Trophy className="w-5 h-5" />
          <span>{showNotification.message}</span>
          <Badge variant="secondary" className="bg-white text-green-600">
            +{showNotification.points} نقطة
          </Badge>
        </div>
      )}
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-600" />
          نظام التقييمات التفاعلي
        </h1>
        <p className="text-gray-600">احصل على النقاط والشارات أثناء تحسين نظام التقييمات</p>
      </div>

      {/* User Profile Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">المطور المتميز</h2>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span className="text-sm">المستوى {userStats.level}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">{userStats.totalPoints} نقطة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    <span className="text-sm">{userStats.streak} يوم متتالي</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                {getRankIcon(userStats.rank)}
                <span className="text-lg font-bold">المركز #{userStats.rank}</span>
              </div>
              <p className="text-sm opacity-80">من أصل {userStats.totalUsers} مستخدم</p>
            </div>
          </div>
          
          {/* Experience Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>التقدم للمستوى التالي</span>
              <span>{userStats.experience}/{userStats.experienceToNext}</span>
            </div>
            <Progress 
              value={(userStats.experience / userStats.experienceToNext) * 100} 
              className="h-2 bg-white bg-opacity-20"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Challenges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              التحديات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {challenges.map(challenge => (
              <div key={challenge.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{challenge.title}</h3>
                  <Badge variant={challenge.completed ? "default" : "outline"}>
                    {challenge.reward} نقطة
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mb-3">{challenge.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>التقدم</span>
                    <span>{challenge.progress}/{challenge.target}</span>
                  </div>
                  <Progress 
                    value={(challenge.progress / challenge.target) * 100} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {challenge.type === 'daily' ? 'يومي' : challenge.type === 'weekly' ? 'أسبوعي' : 'شهري'}
                    </span>
                    {challenge.completed && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        مكتمل
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              الإنجازات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map(achievement => (
              <div 
                key={achievement.id} 
                className={`p-3 rounded-lg border-2 transition-all ${
                  achievement.unlocked 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getRarityColor(achievement.rarity)}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{achievement.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {achievement.points} نقطة
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        تم إنجازه في {new Date(achievement.unlockedAt).toLocaleDateString('ar-SA')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              التقدم الأسبوعي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {userStats.weeklyProgress}/{userStats.weeklyGoal}
              </div>
              <p className="text-sm text-gray-600">عنصر مكتمل هذا الأسبوع</p>
            </div>
            
            <Progress 
              value={(userStats.weeklyProgress / userStats.weeklyGoal) * 100} 
              className="h-3"
            />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>المتبقي</span>
                <span>{userStats.weeklyGoal - userStats.weeklyProgress} عنصر</span>
              </div>
              {userStats.weeklyProgress >= userStats.weeklyGoal && (
                <div className="p-3 bg-green-100 rounded-lg text-center">
                  <Gift className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-green-800">ممتاز! لقد حققت الهدف الأسبوعي</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            إجراءات سريعة للحصول على النقاط
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button onClick={handleAddCategory} variant="outline" className="h-20 flex flex-col gap-2">
              <Target className="w-6 h-6" />
              <span className="text-sm">إنشاء تصنيف</span>
              <Badge variant="secondary" className="text-xs">+100 نقطة</Badge>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2" disabled>
              <Link className="w-6 h-6" />
              <span className="text-sm">ربط عناصر</span>
              <Badge variant="secondary" className="text-xs">+25 نقطة</Badge>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2" disabled>
              <CheckCircle className="w-6 h-6" />
              <span className="text-sm">مراجعة النظام</span>
              <Badge variant="secondary" className="text-xs">+75 نقطة</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GamifiedEvaluationSystem
