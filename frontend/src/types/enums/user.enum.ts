export enum Provider {
  Kakao = 'KAKAO',
  Google = 'GOOGLE',
  Naver = 'NAVER',
  Local = 'LOCAL',
}

export enum Role {
  Admin = 'ADMIN',
  User = 'USER',
}

export enum CommentStatus {
  Normal = 'NORMAL',
  Deleted = 'DELETED',
  AdminDeleted = 'ADMIN_DELETED',
}

export enum AdminTaskType {
  Ban = 'BAN',
  Unban = 'UNBAN',
  Withdraw = 'WITHDRAW',
  UndoWithdraw = 'UNDO_WITHDRAW',
}
