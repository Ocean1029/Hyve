# DashboardClient.tsx 程式碼解析

## 📋 整體架構

這是一個**多用戶專注會話管理系統**的核心組件，負責：
- 管理應用程式的多種狀態（Dashboard、Focus Mode、Summary 等）
- 處理多人協作的專注會話（Focus Session）
- 同步多個用戶的暫停/恢復狀態
- 追蹤會話時間（排除暫停時間）
- 實時同步會話狀態（使用 Server-Sent Events）

---

## 🎯 核心功能

### 1. **狀態管理系統**
使用 `AppState` 枚舉管理應用程式的不同視圖：
- `DASHBOARD`: 主頁面
- `FOCUS`: 專注模式
- `SUMMARY`: 會話總結
- `POST_MEMORY`: 發布記憶
- `FRIEND_PROFILE`: 朋友資料
- `SEARCHING`: 搜尋中
- `FOUND`: 找到朋友
- `QUARTERLY_FEEDBACK`: 季度回饋

### 2. **多用戶會話同步**
- 當任何用戶拿起手機（暫停），所有參與者的會話都會暫停
- 當任何用戶結束會話，所有參與者都會收到通知
- 使用 Server-Sent Events (SSE) 實現實時同步

### 3. **時間追蹤**
- 追蹤實際專注時間（排除暫停時間）
- 使用 `totalPausedSeconds` 累計所有暫停時間
- 使用 `pauseStartTime` 記錄每次暫停的開始時間

---

## 🔑 關鍵狀態變數

### 會話相關
```typescript
const [appState, setAppState] = useState<AppState>(AppState.DASHBOARD);
const [focusStatus, setFocusStatus] = useState<FocusStatus>(FocusStatus.PAUSED);
const [elapsedSeconds, setElapsedSeconds] = useState(0);
const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null);
const [currentFocusSessionId, setCurrentFocusSessionId] = useState<string | null>(null);
```

### 暫停追蹤
```typescript
const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
const [totalPausedSeconds, setTotalPausedSeconds] = useState(0);
const [isSessionPausedByOthers, setIsSessionPausedByOthers] = useState(false);
```

### 設備狀態
```typescript
const [isPhoneFaceDown, setIsPhoneFaceDown] = useState(true);
const { isFaceDown: sensorIsFaceDown, ... } = useDeviceOrientation();
const isFaceDown = sensorAvailable && sensorIsFaceDown !== null 
  ? sensorIsFaceDown 
  : isPhoneFaceDown; // 優先使用感應器，否則使用模擬按鈕
```

### Refs（避免閉包問題）
```typescript
const timerRef = useRef<number | null>(null); // 計時器 ID
const userManuallyExitedRef = useRef(false); // 用戶是否手動退出
const prevFocusStatusRef = useRef<FocusStatus>(FocusStatus.PAUSED); // 前一個狀態
```

---

## ⚙️ 關鍵 useEffect Hooks

### 1. **計時器管理** (81-92行)
```typescript
useEffect(() => {
  if (appState === AppState.FOCUS && focusStatus === FocusStatus.ACTIVE) {
    // 只在 FOCUS 狀態且 ACTIVE 時才計時
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  } else {
    // 其他狀態時停止計時器
    if (timerRef.current) clearInterval(timerRef.current);
  }
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
}, [appState, focusStatus]);
```
**功能**: 當會話處於 ACTIVE 狀態時，每秒增加 `elapsedSeconds`

---

### 2. **focusStatus 更新邏輯** (95-139行)
```typescript
useEffect(() => {
  if (appState === AppState.FOCUS) {
    const currentUserPaused = !isFaceDown; // 當前用戶是否拿起手機
    const shouldBePaused = currentUserPaused || isSessionPausedByOthers;
    const newStatus = shouldBePaused ? FocusStatus.PAUSED : FocusStatus.ACTIVE;
    
    // 追蹤暫停時間
    if (newStatus === FocusStatus.PAUSED && prevStatus === FocusStatus.ACTIVE) {
      setPauseStartTime(new Date()); // 記錄暫停開始時間
    } else if (newStatus === FocusStatus.ACTIVE && prevStatus === FocusStatus.PAUSED) {
      // 恢復時計算暫停時長並累計
      if (pauseStartTime) {
        const pauseDuration = Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000);
        setTotalPausedSeconds(prev => prev + pauseDuration);
        setPauseStartTime(null);
      }
    }
    
    setFocusStatus((currentStatus) => {
      if (newStatus !== currentStatus) {
        prevFocusStatusRef.current = newStatus;
        return newStatus;
      }
      return currentStatus;
    });
  }
}, [isFaceDown, appState, isSessionPausedByOthers]);
```
**功能**: 
- 根據設備方向和他人暫停狀態更新 `focusStatus`
- 追蹤暫停時間，確保計時器只計算實際專注時間

---

### 3. **同步暫停狀態到伺服器** (142-185行)
```typescript
useEffect(() => {
  if (appState === AppState.FOCUS && currentFocusSessionId) {
    const syncPauseStatus = async () => {
      const isPaused = !isFaceDown;
      const response = await fetch(`/api/sessions/${currentFocusSessionId}/pause`, {
        method: 'POST',
        body: JSON.stringify({ isPaused }),
      });
      
      if (response.ok) {
        const result = await response.json();
        // 檢查是否有其他用戶暫停
        const otherUserPaused = result.users.some(
          (u: any) => u.userId !== userId && u.isPaused
        );
        setIsSessionPausedByOthers(otherUserPaused);
      }
    };
    
    // 防抖處理，避免過多 API 調用
    const timeoutId = setTimeout(syncPauseStatus, 300);
    return () => clearTimeout(timeoutId);
  }
}, [isFaceDown, appState, currentFocusSessionId, userId]);
```
**功能**: 當設備方向改變時，同步暫停狀態到伺服器，並更新他人暫停狀態

---

### 4. **Server-Sent Events 實時同步** (189-325行)
```typescript
useEffect(() => {
  const eventSource = new EventSource('/api/sessions/stream');
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'session_status' && data.sessions) {
      // 1. 檢測新會話（自動進入 Focus Mode）
      if (!currentFocusSessionId && data.sessions.length > 0) {
        const newActiveSession = data.sessions.find(s => s.status === 'active');
        if (newActiveSession && !userManuallyExitedRef.current) {
          // 自動進入 Focus Mode
          setCurrentFocusSessionId(newActiveSession.sessionId);
          setSessionStartTime(new Date(newActiveSession.startTime));
          setAppState(AppState.FOCUS);
        }
      }
      
      // 2. 檢測會話結束
      const currentSession = data.sessions.find(s => s.sessionId === currentFocusSessionId);
      if (currentSession && currentSession.status !== 'active') {
        // 會話被他人結束，進入 SUMMARY 狀態
        setAppState(AppState.SUMMARY);
      }
      
      // 3. 更新他人暫停狀態
      if (currentSession) {
        const otherUserPaused = currentSession.users.some(
          (u: any) => u.userId !== userId && u.isPaused
        );
        setIsSessionPausedByOthers(otherUserPaused);
      }
    }
  };
  
  return () => eventSource.close();
}, [appState, currentFocusSessionId, userId, sessionStartTime, friends]);
```
**功能**: 
- 實時接收會話狀態更新
- 自動檢測新會話並進入 Focus Mode
- 檢測會話結束
- 同步他人暫停狀態

---

### 5. **定期檢查活躍會話** (328-436行)
```typescript
useEffect(() => {
  const checkActiveSessions = async () => {
    const result = await getActiveFocusSessions(userId);
    if (result.success && result.sessions && result.sessions.length > 0) {
      const activeSession = result.sessions[0];
      
      // 自動進入 Focus Mode（如果不在 FOCUS 狀態且沒有手動會話）
      if (appState !== AppState.FOCUS && !sessionStartTime && !userManuallyExitedRef.current) {
        setCurrentFocusSessionId(activeSession.id);
        setSessionStartTime(new Date(activeSession.startTime));
        setAppState(AppState.FOCUS);
      }
      
      // 更新他人暫停狀態
      else if (appState === AppState.FOCUS && isSameSession) {
        const otherUserPaused = activeSession.users.some(
          (u: any) => u.userId !== userId && u.isPaused
        );
        setIsSessionPausedByOthers(otherUserPaused);
        
        // 同步已用時間（只在 ACTIVE 時）
        if (focusStatus === FocusStatus.ACTIVE) {
          const totalElapsedSec = Math.floor((now - sessionStart) / 1000);
          const activeElapsedSec = totalElapsedSec - totalPausedSeconds;
          setElapsedSeconds(activeElapsedSec);
        }
      }
    }
  };
  
  checkActiveSessions(); // 立即檢查
  activeSessionCheckIntervalRef.current = setInterval(checkActiveSessions, 3000); // 每 3 秒檢查
  
  return () => {
    if (activeSessionCheckIntervalRef.current) {
      clearInterval(activeSessionCheckIntervalRef.current);
    }
  };
}, [userId, appState, sessionStartTime, currentFocusSessionId, friends]);
```
**功能**: 
- 定期檢查是否有活躍會話（每 3 秒）
- 自動進入 Focus Mode（如果檢測到新會話）
- 同步已用時間和他人暫停狀態

---

## 🎮 關鍵事件處理函數

### `startSession()` (443-457行)
```typescript
const startSession = () => {
  userManuallyExitedRef.current = false; // 重置手動退出標記
  setAppState(AppState.FOCUS);
  setElapsedSeconds(0);
  setSessionStartTime(new Date());
  // 重置所有會話相關狀態
};
```
**功能**: 手動開始新的專注會話

---

### `endSession()` (459-524行)
```typescript
const endSession = async () => {
  const endTime = new Date();
  
  // 如果會話已存在，結束它（會影響所有參與者）
  if (currentFocusSessionId) {
    await fetch(`/api/sessions/${currentFocusSessionId}/end`, {
      method: 'POST',
      body: JSON.stringify({
        endTime: endTime.toISOString(),
        minutes: Math.floor(elapsedSeconds / 60),
      }),
    });
    setAppState(AppState.SUMMARY);
    return;
  }
  
  // 如果會話不存在，創建新會話
  if (elapsedSeconds >= 0 && sessionStartTime) {
    await createFocusSession(userIds, elapsedSeconds, sessionStartTime, endTime);
  }
  
  setAppState(AppState.SUMMARY);
};
```
**功能**: 
- 結束會話（如果已存在，會通知所有參與者）
- 創建新會話（如果不存在）
- 切換到 SUMMARY 狀態

---

### `onReturnHome()` (726-738行)
```typescript
onReturnHome={() => {
  userManuallyExitedRef.current = true; // 標記為手動退出
  setAppState(AppState.DASHBOARD);
  // 清除所有會話相關狀態
  setCurrentFocusSessionId(null);
  setSessionStartTime(null);
  // ...
}}
```
**功能**: 
- 標記用戶手動退出（防止自動重新進入 Focus Mode）
- 清除所有會話狀態
- 返回 Dashboard

---

## 🔄 狀態流程圖

```
DASHBOARD
  ↓ (startSession / 檢測到新會話)
FOCUS (ACTIVE)
  ↓ (拿起手機 / 他人暫停)
FOCUS (PAUSED)
  ↓ (放下手機且無人暫停)
FOCUS (ACTIVE)
  ↓ (endSession)
SUMMARY
  ↓ (onUnlockPhotoMoment)
POST_MEMORY
  ↓ (handleCreateMemory)
DASHBOARD
```

---

## 🎯 多用戶同步機制

### 暫停同步流程
1. **用戶 A 拿起手機** → `isFaceDown = false`
2. **本地更新** → `focusStatus = PAUSED`，計時器停止
3. **API 調用** → `POST /api/sessions/[sessionId]/pause` (isPaused: true)
4. **伺服器更新** → 更新 `FocusSessionUser.isPaused = true`
5. **SSE 推送** → 所有參與者收到更新
6. **其他用戶** → `isSessionPausedByOthers = true` → `focusStatus = PAUSED` → 計時器停止

### 結束會話流程
1. **用戶 A 結束會話** → `POST /api/sessions/[sessionId]/end`
2. **伺服器更新** → `FocusSession.status = 'completed'`
3. **SSE 推送** → 所有參與者收到更新
4. **其他用戶** → 檢測到 `status !== 'active'` → 進入 SUMMARY 狀態

---

## 🐛 關鍵設計決策

### 1. **防止無限循環**
- 使用 `userManuallyExitedRef` 防止用戶手動退出後自動重新進入 Focus Mode

### 2. **避免競爭條件**
- 不在 API 響應中直接更新 `focusStatus`，而是更新 `isSessionPausedByOthers`
- 讓主 useEffect 統一處理 `focusStatus` 更新

### 3. **準確的時間追蹤**
- 使用 `totalPausedSeconds` 累計所有暫停時間
- 計算實際專注時間時：`實際時間 = 總時間 - 暫停時間`

### 4. **防抖處理**
- 暫停狀態同步使用 300ms 防抖，避免過多 API 調用

### 5. **多層同步機制**
- SSE 實時同步（主要）
- 定期檢查（每 3 秒，備用）
- API 響應更新（立即反饋）

---

## 📝 注意事項

1. **依賴項管理**: 多個 useEffect 的依賴項需要仔細管理，避免不必要的重新執行
2. **狀態同步**: `focusStatus` 的更新統一由主 useEffect 處理，避免多處更新造成衝突
3. **時間計算**: 實際專注時間需要排除所有暫停時間，確保準確性
4. **錯誤處理**: API 調用都有 try-catch，但可以加強用戶提示

---

## 🔧 可能的改進點

1. **錯誤處理**: 增加更友好的錯誤提示
2. **性能優化**: 減少不必要的重新渲染
3. **代碼拆分**: 將複雜的 useEffect 拆分為自定義 hooks
4. **類型安全**: 部分 `any` 類型可以更具體化
5. **測試**: 增加單元測試和集成測試


