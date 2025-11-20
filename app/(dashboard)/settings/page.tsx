'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Shield, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getUsers,
  updateUserRole,
  getServices,
  addService,
  removeService,
  getCurrentUser,
} from '@/lib/storage'
import { User, UserRole, ServiceType } from '@/lib/types'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [services, setServices] = useState<ServiceType[]>([])
  const [newService, setNewService] = useState('')
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)
    
    if (!user || !['CEO', 'TEAM_LEADER'].includes(user.role)) {
      router.push('/tasks')
      return
    }
    
    setIsLoading(false)
  }, [router])

  useEffect(() => {
    if (!isLoading && currentUser) {
      loadData()
    }
  }, [isLoading, currentUser])

  const loadData = async () => {
    const usersList = await getUsers()
    const servicesList = await getServices()
    setUsers(Array.isArray(usersList) ? usersList : [])
    setServices(Array.isArray(servicesList) ? servicesList : [])
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await updateUserRole(userId, newRole)
    await loadData()
  }

  const handleAddService = async () => {
    if (!newService.trim()) return

    if (services.includes(newService as ServiceType)) {
      alert('이미 존재하는 서비스입니다.')
      return
    }

    await addService(newService)
    setNewService('')
    await loadData()
  }

  const handleRemoveService = async (service: ServiceType) => {
    if (['TRP', 'RPA-D', 'Kingbus', 'Link', 'Link-M', 'Link-TRP', 'Link-D', '기타'].includes(service)) {
      alert('기본 서비스는 삭제할 수 없습니다.')
      return
    }

    await removeService(service)
    await loadData()
  }

  const roleLabels = {
    CEO: '대표',
    TEAM_LEADER: '팀장',
    MEMBER: '팀원',
    VISITOR: '방문자',
  }

  const roleBadgeColors = {
    CEO: 'bg-red-500',
    TEAM_LEADER: 'bg-blue-500',
    MEMBER: 'bg-gray-500',
    VISITOR: 'bg-yellow-500',
  }

  if (isLoading || !currentUser || !['CEO', 'TEAM_LEADER'].includes(currentUser.role)) {
    return null
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          시스템 설정 및 권한을 관리하세요
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            사용자 권한
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            서비스 관리
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>사용자 권한 관리</CardTitle>
              <CardDescription>
                팀원들의 권한을 설정할 수 있습니다. 대표와 팀장은 결재 권한을 가집니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>현재 권한</TableHead>
                      <TableHead>권한 변경</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.id}</TableCell>
                        <TableCell>
                          <Badge className={roleBadgeColors[user.role]}>
                            {roleLabels[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) =>
                              handleRoleChange(user.id, value as UserRole)
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CEO">대표</SelectItem>
                              <SelectItem value="TEAM_LEADER">팀장</SelectItem>
                              <SelectItem value="MEMBER">팀원</SelectItem>
                              <SelectItem value="VISITOR">방문자</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 rounded-md bg-muted p-4">
                <h4 className="mb-2 font-medium text-sm">권한 설명</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Badge className="bg-red-500">대표</Badge>
                    <span>
                      최종 결재 권한을 가지며, 팀장이 승인한 업무를 최종 승인합니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge className="bg-blue-500">팀장</Badge>
                    <span>
                      1차 결재 권한을 가지며, 의견을 남긴 후 대표에게 결재를 넘깁니다.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge className="bg-gray-500">팀원</Badge>
                    <span>업무를 생성하고 진행할 수 있습니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge className="bg-yellow-500">방문자</Badge>
                    <span>모든 데이터를 조회할 수 있지만, 생성/수정/삭제 권한은 없습니다.</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>서비스 관리</CardTitle>
              <CardDescription>
                프로젝트에서 사용할 서비스를 추가하거나 제거할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="newService" className="sr-only">
                    새 서비스 이름
                  </Label>
                  <Input
                    id="newService"
                    placeholder="새 서비스 이름을 입력하세요"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddService()
                      }
                    }}
                  />
                </div>
                <Button onClick={handleAddService}>
                  <Plus className="mr-2 h-4 w-4" />
                  추가
                </Button>
              </div>

              <Separator className="my-6" />

              <div>
                <h4 className="mb-4 font-medium text-sm">등록된 서비스</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service) => {
                    const isDefault = [
                      'TRP',
                      'RPA-D',
                      'Kingbus',
                      'Link',
                      'Link-M',
                      'Link-TRP',
                      'Link-D',
                      '기타',
                    ].includes(service)

                    return (
                      <Card key={service}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{service}</span>
                            {isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                기본
                              </Badge>
                            )}
                          </div>
                          {!isDefault && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveService(service)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">삭제</span>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              <div className="mt-6 rounded-md bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  기본 서비스는 삭제할 수 없습니다. 추가한 서비스만 삭제가 가능합니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
