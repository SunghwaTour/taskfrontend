# Kingbus Task Manager API 명세서

버전: 1.0.0
최종 업데이트: 2025-11-19

## 개요

이 문서는 Kingbus Task Manager의 RESTful API 명세를 정의합니다. 현재 애플리케이션은 localStorage 기반이지만, 향후 백엔드 API 구현을 위한 완전한 엔드포인트 명세를 제공합니다.

### 기본 정보

- **Base URL**: `https://api.kingbus-task.com/v1`
- **Content-Type**: `application/json`
- **Authentication**: Bearer Token (JWT)
- **언어**: 한국어(ko-KR) 기본

---

## 인증 (Authentication)

### 1. 로그인

사용자 인증을 수행하고 액세스 토큰을 발급받습니다.

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "name": "이주성",
  "password": "0000"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "name": "이주성",
      "role": "TEAM_LEADER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

**Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이름 또는 비밀번호가 잘못되었습니다."
  }
}
```

### 2. 로그아웃

사용자 세션을 종료합니다.

**Endpoint**: `POST /auth/logout`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

### 3. 현재 사용자 정보 조회

로그인한 사용자의 정보를 조회합니다.

**Endpoint**: `GET /auth/me`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "이주성",
    "role": "TEAM_LEADER"
  }
}
```

---

## 사용자 관리 (Users)

### 1. 사용자 목록 조회

모든 사용자 목록을 조회합니다.

**Endpoint**: `GET /users`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "이주성",
      "role": "TEAM_LEADER"
    },
    {
      "id": "2",
      "name": "김형주",
      "role": "CEO"
    }
  ]
}
```

### 2. 사용자 상세 조회

특정 사용자의 상세 정보를 조회합니다.

**Endpoint**: `GET /users/:userId`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "이주성",
    "role": "TEAM_LEADER"
  }
}
```

### 3. 사용자 역할 변경

사용자의 역할을 변경합니다. (CEO, TEAM_LEADER만 가능)

**Endpoint**: `PATCH /users/:userId/role`

**Headers**:
```
Authorization: Bearer {token}
```

**Request Body**:
```json
{
  "role": "TEAM_LEADER"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "이주성",
    "role": "TEAM_LEADER"
  }
}
```

**Response** (403 Forbidden):
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "권한이 없습니다."
  }
}
```

---

## 업무 관리 (Tasks)

### 1. 업무 목록 조회

모든 업무를 조회합니다.

**Endpoint**: `GET /tasks`

**Query Parameters**:
- `status` (optional): BACKLOG | TODO | DOING | DONE
- `category` (optional): 일반 | 기획 | 디자인 | 개발 | 배포
- `service` (optional): TRP | RPA-D | Kingbus | Link | Link-M | Link-TRP | Link-D | 기타
- `assignee` (optional): 담당자 ID
- `search` (optional): 검색 키워드 (제목, 내용)
- `page` (optional): 페이지 번호 (default: 1)
- `limit` (optional): 페이지당 항목 수 (default: 50)

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-001",
        "title": "사용자 인증 기능 개발",
        "category": "개발",
        "relatedTasks": ["task-002"],
        "service": "Kingbus",
        "startDate": "2025-11-15",
        "dueDate": "2025-11-30",
        "content": "JWT 기반 사용자 인증 시스템 구축",
        "files": [
          {
            "id": "file-001",
            "name": "기획서.pdf",
            "type": "기안서",
            "url": "https://storage.kingbus.com/files/file-001.pdf"
          }
        ],
        "assignees": ["1", "4"],
        "cc": ["2"],
        "status": "DOING",
        "createdBy": "1",
        "createdAt": "2025-11-15T09:00:00.000Z",
        "updatedAt": "2025-11-18T14:30:00.000Z",
        "comments": [
          {
            "id": "comment-001",
            "content": "API 설계 완료했습니다.",
            "createdBy": "1",
            "createdAt": "2025-11-18T14:30:00.000Z"
          }
        ]
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

### 2. 업무 상세 조회

특정 업무의 상세 정보를 조회합니다.

**Endpoint**: `GET /tasks/:taskId`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "task-001",
    "title": "사용자 인증 기능 개발",
    "category": "개발",
    "relatedTasks": ["task-002"],
    "service": "Kingbus",
    "startDate": "2025-11-15",
    "dueDate": "2025-11-30",
    "content": "JWT 기반 사용자 인증 시스템 구축",
    "files": [],
    "assignees": ["1", "4"],
    "cc": ["2"],
    "status": "DOING",
    "createdBy": "1",
    "createdAt": "2025-11-15T09:00:00.000Z",
    "updatedAt": "2025-11-18T14:30:00.000Z",
    "comments": []
  }
}
```

### 3. 업무 생성

새로운 업무를 생성합니다.

**Endpoint**: `POST /tasks`

**Request Body**:
```json
{
  "title": "사용자 인증 기능 개발",
  "category": "개발",
  "relatedTasks": [],
  "service": "Kingbus",
  "startDate": "2025-11-15",
  "dueDate": "2025-11-30",
  "content": "JWT 기반 사용자 인증 시스템 구축",
  "files": [],
  "assignees": ["1", "4"],
  "cc": ["2"],
  "status": "TODO"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "task-001",
    "title": "사용자 인증 기능 개발",
    "category": "개발",
    "relatedTasks": [],
    "service": "Kingbus",
    "startDate": "2025-11-15",
    "dueDate": "2025-11-30",
    "content": "JWT 기반 사용자 인증 시스템 구축",
    "files": [],
    "assignees": ["1", "4"],
    "cc": ["2"],
    "status": "TODO",
    "createdBy": "1",
    "createdAt": "2025-11-15T09:00:00.000Z",
    "updatedAt": "2025-11-15T09:00:00.000Z",
    "comments": []
  }
}
```

### 4. 업무 수정

기존 업무를 수정합니다.

**Endpoint**: `PATCH /tasks/:taskId`

**Request Body** (부분 수정 가능):
```json
{
  "status": "DONE",
  "content": "JWT 기반 사용자 인증 시스템 구축 완료"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "task-001",
    "title": "사용자 인증 기능 개발",
    "status": "DONE",
    "content": "JWT 기반 사용자 인증 시스템 구축 완료",
    "updatedAt": "2025-11-19T10:00:00.000Z"
  }
}
```

### 5. 업무 삭제

업무를 삭제합니다.

**Endpoint**: `DELETE /tasks/:taskId`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "업무가 삭제되었습니다."
}
```

### 6. 업무에 댓글 추가

업무에 댓글을 추가합니다.

**Endpoint**: `POST /tasks/:taskId/comments`

**Request Body**:
```json
{
  "content": "작업 진행 상황 업데이트드립니다."
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "comment-001",
    "content": "작업 진행 상황 업데이트드립니다.",
    "createdBy": "1",
    "createdAt": "2025-11-19T10:00:00.000Z"
  }
}
```

### 7. 업무 파일 업로드

업무에 파일을 첨부합니다.

**Endpoint**: `POST /tasks/:taskId/files`

**Request** (multipart/form-data):
```
file: [binary]
type: 기안서 | 품의서 | 기타
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "file-001",
    "name": "기획서.pdf",
    "type": "기안서",
    "url": "https://storage.kingbus.com/files/file-001.pdf"
  }
}
```

### 8. 업무 파일 삭제

업무에서 파일을 삭제합니다.

**Endpoint**: `DELETE /tasks/:taskId/files/:fileId`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "파일이 삭제되었습니다."
}
```

---

## 결재 관리 (Approvals)

### 1. 결재 목록 조회

결재 목록을 조회합니다.

**Endpoint**: `GET /approvals`

**Query Parameters**:
- `status` (optional): PENDING | APPROVED | REJECTED
- `search` (optional): 검색 키워드
- `page` (optional): 페이지 번호 (default: 1)
- `limit` (optional): 페이지당 항목 수 (default: 50)

**권한**:
- MEMBER: 본인이 생성한 결재만 조회
- TEAM_LEADER, CEO: 모든 결재 조회

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "approvals": [
      {
        "id": "approval-001",
        "taskId": "task-001",
        "summary": "사용자 인증 기능 개발 완료",
        "links": [
          "https://github.com/kingbus/task/pull/123"
        ],
        "status": "APPROVED",
        "teamLeaderComment": "확인했습니다.",
        "teamLeaderApprovedAt": "2025-11-18T15:00:00.000Z",
        "teamLeaderApprovedBy": "3",
        "ceoComment": "승인합니다.",
        "ceoApprovedAt": "2025-11-19T09:00:00.000Z",
        "ceoApprovedBy": "2",
        "nextTasks": ["task-002", "task-003"],
        "createdBy": "1",
        "createdAt": "2025-11-18T14:00:00.000Z",
        "comments": []
      }
    ],
    "pagination": {
      "total": 23,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

### 2. 결재 상세 조회

특정 결재의 상세 정보를 조회합니다.

**Endpoint**: `GET /approvals/:approvalId`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "approval-001",
    "taskId": "task-001",
    "summary": "사용자 인증 기능 개발 완료",
    "links": ["https://github.com/kingbus/task/pull/123"],
    "status": "APPROVED",
    "teamLeaderComment": "확인했습니다.",
    "teamLeaderApprovedAt": "2025-11-18T15:00:00.000Z",
    "teamLeaderApprovedBy": "3",
    "ceoComment": "승인합니다.",
    "ceoApprovedAt": "2025-11-19T09:00:00.000Z",
    "ceoApprovedBy": "2",
    "nextTasks": ["task-002"],
    "createdBy": "1",
    "createdAt": "2025-11-18T14:00:00.000Z",
    "comments": []
  }
}
```

### 3. 결재 생성

새로운 결재를 생성합니다.

**Endpoint**: `POST /approvals`

**Request Body**:
```json
{
  "taskId": "task-001",
  "summary": "사용자 인증 기능 개발 완료",
  "links": [
    "https://github.com/kingbus/task/pull/123"
  ],
  "nextTasks": ["task-002"]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "approval-001",
    "taskId": "task-001",
    "summary": "사용자 인증 기능 개발 완료",
    "links": ["https://github.com/kingbus/task/pull/123"],
    "status": "PENDING",
    "nextTasks": ["task-002"],
    "createdBy": "1",
    "createdAt": "2025-11-18T14:00:00.000Z",
    "comments": []
  }
}
```

### 4. 팀장 승인/반려

팀장이 결재를 승인 또는 반려합니다.

**Endpoint**: `POST /approvals/:approvalId/team-leader-approve`

**권한**: TEAM_LEADER만 가능

**Request Body**:
```json
{
  "approved": true,
  "comment": "확인했습니다."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "approval-001",
    "status": "PENDING",
    "teamLeaderComment": "확인했습니다.",
    "teamLeaderApprovedAt": "2025-11-18T15:00:00.000Z",
    "teamLeaderApprovedBy": "3"
  }
}
```

**반려 시 Request Body**:
```json
{
  "approved": false,
  "comment": "추가 수정이 필요합니다.",
  "rejectionReason": "테스트 케이스 부족"
}
```

**반려 시 Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "approval-001",
    "status": "REJECTED",
    "rejectionReason": "테스트 케이스 부족",
    "teamLeaderComment": "추가 수정이 필요합니다."
  }
}
```

### 5. CEO 승인/반려

CEO가 결재를 최종 승인 또는 반려합니다.

**Endpoint**: `POST /approvals/:approvalId/ceo-approve`

**권한**: CEO만 가능

**조건**: 팀장 승인이 완료된 경우에만 가능

**Request Body**:
```json
{
  "approved": true,
  "comment": "승인합니다."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "approval-001",
    "status": "APPROVED",
    "ceoComment": "승인합니다.",
    "ceoApprovedAt": "2025-11-19T09:00:00.000Z",
    "ceoApprovedBy": "2"
  }
}
```

### 6. 결재 수정

결재 정보를 수정합니다. (작성자만 가능, PENDING 상태에서만)

**Endpoint**: `PATCH /approvals/:approvalId`

**Request Body**:
```json
{
  "summary": "수정된 요약",
  "links": ["https://github.com/kingbus/task/pull/124"],
  "nextTasks": ["task-002", "task-003"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "approval-001",
    "summary": "수정된 요약",
    "links": ["https://github.com/kingbus/task/pull/124"],
    "nextTasks": ["task-002", "task-003"],
    "updatedAt": "2025-11-18T16:00:00.000Z"
  }
}
```

### 7. 결재 삭제

결재를 삭제합니다. (작성자만 가능, PENDING 상태에서만)

**Endpoint**: `DELETE /approvals/:approvalId`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "결재가 삭제되었습니다."
}
```

### 8. 결재에 댓글 추가

결재에 댓글을 추가합니다.

**Endpoint**: `POST /approvals/:approvalId/comments`

**Request Body**:
```json
{
  "content": "진행 상황 확인 부탁드립니다."
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "comment-001",
    "content": "진행 상황 확인 부탁드립니다.",
    "createdBy": "1",
    "createdAt": "2025-11-19T10:00:00.000Z"
  }
}
```

---

## 보고서 관리 (Reports)

### 1. 보고서 목록 조회

보고서 목록을 조회합니다.

**Endpoint**: `GET /reports`

**Query Parameters**:
- `type` (optional): WEEKLY | MONTHLY
- `year` (optional): 연도 (예: 2025)
- `search` (optional): 검색 키워드
- `page` (optional): 페이지 번호 (default: 1)
- `limit` (optional): 페이지당 항목 수 (default: 50)

**권한**:
- MEMBER: 본인이 작성한 보고서만 조회
- TEAM_LEADER, CEO: 모든 보고서 조회

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report-001",
        "type": "WEEKLY",
        "weekNumber": "47",
        "year": "2025",
        "tasks": ["task-001", "task-002"],
        "content": "이번 주 완료한 주요 업무:\n1. 사용자 인증 기능 개발\n2. API 명세서 작성",
        "createdBy": "1",
        "createdAt": "2025-11-19T09:00:00.000Z"
      },
      {
        "id": "report-002",
        "type": "MONTHLY",
        "month": "11",
        "year": "2025",
        "tasks": ["task-001", "task-002", "task-003"],
        "content": "11월 월간 보고서",
        "createdBy": "1",
        "createdAt": "2025-11-30T09:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

### 2. 보고서 상세 조회

특정 보고서의 상세 정보를 조회합니다.

**Endpoint**: `GET /reports/:reportId`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "report-001",
    "type": "WEEKLY",
    "weekNumber": "47",
    "year": "2025",
    "tasks": ["task-001", "task-002"],
    "content": "이번 주 완료한 주요 업무:\n1. 사용자 인증 기능 개발\n2. API 명세서 작성",
    "createdBy": "1",
    "createdAt": "2025-11-19T09:00:00.000Z"
  }
}
```

### 3. 보고서 생성

새로운 보고서를 생성합니다.

**Endpoint**: `POST /reports`

**Request Body** (주간 보고서):
```json
{
  "type": "WEEKLY",
  "weekNumber": "47",
  "year": "2025",
  "tasks": ["task-001", "task-002"],
  "content": "이번 주 완료한 주요 업무:\n1. 사용자 인증 기능 개발\n2. API 명세서 작성"
}
```

**Request Body** (월간 보고서):
```json
{
  "type": "MONTHLY",
  "month": "11",
  "year": "2025",
  "tasks": ["task-001", "task-002", "task-003"],
  "content": "11월 월간 보고서"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "report-001",
    "type": "WEEKLY",
    "weekNumber": "47",
    "year": "2025",
    "tasks": ["task-001", "task-002"],
    "content": "이번 주 완료한 주요 업무:\n1. 사용자 인증 기능 개발\n2. API 명세서 작성",
    "createdBy": "1",
    "createdAt": "2025-11-19T09:00:00.000Z"
  }
}
```

### 4. 보고서 수정

보고서를 수정합니다. (작성자만 가능)

**Endpoint**: `PATCH /reports/:reportId`

**Request Body**:
```json
{
  "content": "수정된 보고서 내용",
  "tasks": ["task-001", "task-002", "task-004"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "report-001",
    "content": "수정된 보고서 내용",
    "tasks": ["task-001", "task-002", "task-004"],
    "updatedAt": "2025-11-19T11:00:00.000Z"
  }
}
```

### 5. 보고서 삭제

보고서를 삭제합니다. (작성자 또는 TEAM_LEADER, CEO만 가능)

**Endpoint**: `DELETE /reports/:reportId`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "보고서가 삭제되었습니다."
}
```

---

## 패치노트 및 공지 (Announcements)

### 1. 공지사항 목록 조회

패치노트와 긴급 공지사항 목록을 조회합니다.

**Endpoint**: `GET /announcements`

**Query Parameters**:
- `type` (optional): urgent | patch
- `platform` (optional): Android | iOS | Web
- `search` (optional): 검색 키워드
- `page` (optional): 페이지 번호 (default: 1)
- `limit` (optional): 페이지당 항목 수 (default: 50)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "announcements": [
      {
        "id": "announcement-001",
        "type": "patch",
        "title": "11월 정기 업데이트",
        "platform": "Android",
        "deadline": "2025-11-30",
        "approvalId": "approval-001",
        "version": "1.2.0",
        "items": [
          {
            "id": "item-001",
            "content": "사용자 인증 기능 추가",
            "image": "https://storage.kingbus.com/images/auth-feature.png"
          },
          {
            "id": "item-002",
            "content": "UI/UX 개선"
          }
        ],
        "createdBy": "1",
        "createdAt": "2025-11-19T09:00:00.000Z"
      },
      {
        "id": "announcement-002",
        "type": "urgent",
        "title": "긴급 점검 안내",
        "subtitle": "서버 점검",
        "content": "2025년 11월 20일 02:00 - 04:00 서버 점검이 예정되어 있습니다.",
        "platform": "Android",
        "deadline": "2025-11-20T04:00:00.000Z",
        "createdBy": "2",
        "createdAt": "2025-11-19T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 12,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

### 2. 공지사항 상세 조회

특정 공지사항의 상세 정보를 조회합니다.

**Endpoint**: `GET /announcements/:announcementId`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "announcement-001",
    "type": "patch",
    "title": "11월 정기 업데이트",
    "platform": "Android",
    "deadline": "2025-11-30",
    "approvalId": "approval-001",
    "version": "1.2.0",
    "items": [
      {
        "id": "item-001",
        "content": "사용자 인증 기능 추가",
        "image": "https://storage.kingbus.com/images/auth-feature.png"
      }
    ],
    "createdBy": "1",
    "createdAt": "2025-11-19T09:00:00.000Z"
  }
}
```

### 3. 패치노트 생성

새로운 패치노트를 생성합니다.

**Endpoint**: `POST /announcements/patch-notes`

**Request Body**:
```json
{
  "title": "11월 정기 업데이트",
  "approvalId": "approval-001",
  "platform": "Android",
  "version": "1.2.0",
  "items": [
    {
      "content": "사용자 인증 기능 추가",
      "image": "https://storage.kingbus.com/images/auth-feature.png"
    },
    {
      "content": "UI/UX 개선"
    }
  ],
  "deadline": "2025-11-30"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "announcement-001",
    "type": "patch",
    "title": "11월 정기 업데이트",
    "platform": "Android",
    "deadline": "2025-11-30",
    "approvalId": "approval-001",
    "version": "1.2.0",
    "items": [
      {
        "id": "item-001",
        "content": "사용자 인증 기능 추가",
        "image": "https://storage.kingbus.com/images/auth-feature.png"
      },
      {
        "id": "item-002",
        "content": "UI/UX 개선"
      }
    ],
    "createdBy": "1",
    "createdAt": "2025-11-19T09:00:00.000Z"
  }
}
```

### 4. 긴급 공지사항 생성

긴급 공지사항을 생성합니다.

**Endpoint**: `POST /announcements/urgent`

**Request Body**:
```json
{
  "title": "긴급 점검 안내",
  "subtitle": "서버 점검",
  "content": "2025년 11월 20일 02:00 - 04:00 서버 점검이 예정되어 있습니다.",
  "platform": "Android",
  "deadline": "2025-11-20T04:00:00.000Z"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "announcement-002",
    "type": "urgent",
    "title": "긴급 점검 안내",
    "subtitle": "서버 점검",
    "content": "2025년 11월 20일 02:00 - 04:00 서버 점검이 예정되어 있습니다.",
    "platform": "Android",
    "deadline": "2025-11-20T04:00:00.000Z",
    "createdBy": "2",
    "createdAt": "2025-11-19T10:00:00.000Z"
  }
}
```

### 5. 공지사항 수정

공지사항을 수정합니다. (작성자만 가능)

**Endpoint**: `PATCH /announcements/:announcementId`

**Request Body** (패치노트):
```json
{
  "title": "수정된 제목",
  "version": "1.2.1",
  "items": [
    {
      "content": "새로운 항목"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "announcement-001",
    "title": "수정된 제목",
    "version": "1.2.1",
    "updatedAt": "2025-11-19T12:00:00.000Z"
  }
}
```

### 6. 공지사항 삭제

공지사항을 삭제합니다. (작성자 또는 TEAM_LEADER, CEO만 가능)

**Endpoint**: `DELETE /announcements/:announcementId`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "공지사항이 삭제되었습니다."
}
```

---

## 서비스 타입 관리 (Services)

### 1. 서비스 목록 조회

등록된 서비스 타입 목록을 조회합니다.

**Endpoint**: `GET /services`

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    "TRP",
    "RPA-D",
    "Kingbus",
    "Link",
    "Link-M",
    "Link-TRP",
    "Link-D",
    "기타"
  ]
}
```

### 2. 서비스 추가

새로운 서비스 타입을 추가합니다. (CEO, TEAM_LEADER만 가능)

**Endpoint**: `POST /services`

**Request Body**:
```json
{
  "name": "NewService"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "name": "NewService"
  }
}
```

### 3. 서비스 삭제

서비스 타입을 삭제합니다. (CEO, TEAM_LEADER만 가능)

**Endpoint**: `DELETE /services/:serviceName`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "서비스가 삭제되었습니다."
}
```

---

## 통계 및 대시보드 (Statistics)

### 1. 대시보드 통계

대시보드에 필요한 전체 통계를 조회합니다.

**Endpoint**: `GET /statistics/dashboard`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "tasks": {
      "total": 45,
      "byStatus": {
        "BACKLOG": 5,
        "TODO": 12,
        "DOING": 18,
        "DONE": 10
      },
      "byCategory": {
        "일반": 8,
        "기획": 5,
        "디자인": 7,
        "개발": 20,
        "배포": 5
      },
      "byService": {
        "Kingbus": 25,
        "TRP": 10,
        "Link": 10
      }
    },
    "approvals": {
      "total": 23,
      "byStatus": {
        "PENDING": 8,
        "APPROVED": 12,
        "REJECTED": 3
      }
    },
    "reports": {
      "total": 15,
      "byType": {
        "WEEKLY": 12,
        "MONTHLY": 3
      }
    },
    "announcements": {
      "total": 12,
      "byType": {
        "urgent": 3,
        "patch": 9
      }
    }
  }
}
```

### 2. 사용자별 업무 통계

특정 사용자의 업무 통계를 조회합니다.

**Endpoint**: `GET /statistics/users/:userId/tasks`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "userId": "1",
    "userName": "이주성",
    "tasks": {
      "assigned": 15,
      "completed": 8,
      "inProgress": 5,
      "overdue": 2
    },
    "approvals": {
      "submitted": 10,
      "approved": 7,
      "rejected": 1,
      "pending": 2
    },
    "reports": {
      "total": 5,
      "thisWeek": 1,
      "thisMonth": 1
    }
  }
}
```

---

## 에러 코드

API에서 반환하는 표준 에러 코드입니다.

| HTTP Status | Error Code | 설명 |
|-------------|------------|------|
| 400 | BAD_REQUEST | 잘못된 요청 파라미터 |
| 401 | UNAUTHORIZED | 인증 실패 |
| 401 | INVALID_CREDENTIALS | 잘못된 로그인 정보 |
| 401 | TOKEN_EXPIRED | 토큰 만료 |
| 403 | FORBIDDEN | 권한 없음 |
| 404 | NOT_FOUND | 리소스를 찾을 수 없음 |
| 409 | CONFLICT | 리소스 충돌 (중복 등) |
| 422 | VALIDATION_ERROR | 유효성 검증 실패 |
| 500 | INTERNAL_SERVER_ERROR | 서버 내부 오류 |

**에러 응답 형식**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "유효성 검증에 실패했습니다.",
    "details": [
      {
        "field": "title",
        "message": "제목은 필수입니다."
      }
    ]
  }
}
```

---

## 데이터 타입 정의

### User
```typescript
interface User {
  id: string
  name: string
  role: 'CEO' | 'TEAM_LEADER' | 'MEMBER'
}
```

### Task
```typescript
interface Task {
  id: string
  title: string
  category: '일반' | '기획' | '디자인' | '개발' | '배포'
  relatedTasks: string[]
  service: ServiceType
  startDate: string | null  // ISO 8601 format
  dueDate: string | null    // ISO 8601 format
  content: string
  files: TaskFile[]
  assignees: string[]       // User IDs
  cc: string[]             // User IDs
  status: 'BACKLOG' | 'TODO' | 'DOING' | 'DONE'
  createdBy: string        // User ID
  createdAt: string        // ISO 8601 format
  updatedAt: string        // ISO 8601 format
  comments: Comment[]
}
```

### Approval
```typescript
interface Approval {
  id: string
  taskId: string
  summary: string
  links: string[]
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  teamLeaderComment?: string
  teamLeaderApprovedAt?: string  // ISO 8601 format
  teamLeaderApprovedBy?: string  // User ID
  ceoComment?: string
  ceoApprovedAt?: string         // ISO 8601 format
  ceoApprovedBy?: string         // User ID
  rejectionReason?: string
  nextTasks: string[]            // Task IDs
  createdBy: string              // User ID
  createdAt: string              // ISO 8601 format
  comments: Comment[]
}
```

### Report
```typescript
interface Report {
  id: string
  type: 'WEEKLY' | 'MONTHLY'
  weekNumber?: string      // 1-53
  month?: string          // 1-12
  year: string
  tasks: string[]         // Task IDs
  content: string
  createdBy: string       // User ID
  createdAt: string       // ISO 8601 format
}
```

### Announcement
```typescript
interface Announcement {
  id: string
  type: 'urgent' | 'patch'
  title: string
  subtitle?: string       // For urgent announcements
  content?: string       // For urgent announcements
  platform: 'Android' | 'iOS' | 'Web'
  deadline: string       // ISO 8601 format
  // For patch notes
  approvalId?: string
  version?: string
  items?: PatchNoteItem[]
  createdBy: string      // User ID
  createdAt: string      // ISO 8601 format
}

interface PatchNoteItem {
  id: string
  content: string
  image?: string         // URL
}
```

### Comment
```typescript
interface Comment {
  id: string
  content: string
  createdBy: string      // User ID
  createdAt: string      // ISO 8601 format
}
```

### TaskFile
```typescript
interface TaskFile {
  id: string
  name: string
  type: '기안서' | '품의서' | '기타'
  url: string
}
```

### ServiceType
```typescript
type ServiceType = 'TRP' | 'RPA-D' | 'Kingbus' | 'Link' | 'Link-M' | 'Link-TRP' | 'Link-D' | '기타' | string
```

---

## 인증 및 권한

### 인증 방식
- JWT (JSON Web Token) 기반 인증
- Bearer Token 헤더: `Authorization: Bearer {token}`
- 토큰 만료 시간: 24시간

### 권한 레벨

| Role | 권한 |
|------|------|
| CEO | 모든 기능 접근, 모든 데이터 조회/수정, 최종 결재 승인 |
| TEAM_LEADER | 모든 데이터 조회, 팀원 업무 관리, 1차 결재 승인, 사용자 역할 변경 |
| MEMBER | 본인 관련 데이터만 조회/수정, 업무 생성/수정, 결재 요청 |

### 권한 제약

- **사용자 역할 변경**: CEO, TEAM_LEADER만 가능
- **결재 승인**:
  - 팀장 승인: TEAM_LEADER만 가능
  - CEO 승인: CEO만 가능 (팀장 승인 후)
- **데이터 조회 범위**:
  - MEMBER: 본인이 생성하거나 관련된 데이터만
  - TEAM_LEADER, CEO: 모든 데이터
- **데이터 수정/삭제**:
  - 기본적으로 작성자만 가능
  - TEAM_LEADER, CEO는 모든 데이터 삭제 가능

---

## 페이지네이션

모든 목록 조회 API는 페이지네이션을 지원합니다.

**Query Parameters**:
- `page`: 페이지 번호 (default: 1)
- `limit`: 페이지당 항목 수 (default: 50, max: 100)

**Response Format**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 50,
      "totalPages": 2
    }
  }
}
```

---

## 날짜 형식

모든 날짜는 ISO 8601 형식을 따릅니다.

- 날짜: `YYYY-MM-DD` (예: 2025-11-19)
- 날짜 + 시간: `YYYY-MM-DDTHH:mm:ss.sssZ` (예: 2025-11-19T09:00:00.000Z)
- 타임존: UTC 기준

---

## 파일 업로드

파일 업로드는 multipart/form-data 형식을 사용합니다.

**허용 파일 타입**:
- 문서: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- 이미지: JPG, JPEG, PNG, GIF, SVG
- 압축: ZIP, RAR

**최대 파일 크기**: 10MB

**스토리지**: AWS S3 또는 유사한 클라우드 스토리지 사용 권장

---

## Rate Limiting

API 요청 제한:
- 인증된 사용자: 1000 requests/hour
- 인증되지 않은 사용자: 100 requests/hour

Rate limit 초과 시 응답:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "요청 횟수 제한을 초과했습니다.",
    "retryAfter": 3600
  }
}
```

---

## 버전 관리

API 버전은 URL 경로에 포함됩니다: `/v1/...`

새로운 버전 출시 시 이전 버전은 최소 6개월간 유지됩니다.

---

## 웹훅 (향후 구현)

특정 이벤트 발생 시 등록된 URL로 알림을 전송합니다.

**지원 예정 이벤트**:
- `task.created`: 업무 생성
- `task.updated`: 업무 수정
- `task.status_changed`: 업무 상태 변경
- `approval.created`: 결재 요청
- `approval.approved`: 결재 승인
- `approval.rejected`: 결재 반려

---

## 실시간 업데이트 (WebSocket)

실시간 업데이트를 위한 WebSocket 연결을 지원합니다.

**WebSocket URL**: `wss://api.kingbus-task.com/v1/ws`

**연결 시 인증**:
```json
{
  "type": "auth",
  "token": "Bearer {token}"
}
```

**구독 가능한 채널**:
- `tasks`: 업무 변경 사항
- `approvals`: 결재 변경 사항
- `announcements`: 공지사항 추가/수정
- `user:{userId}`: 특정 사용자 관련 알림

**메시지 형식**:
```json
{
  "type": "task.updated",
  "data": {
    "id": "task-001",
    "status": "DONE"
  },
  "timestamp": "2025-11-19T10:00:00.000Z"
}
```
