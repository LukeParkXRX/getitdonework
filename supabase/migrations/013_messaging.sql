-- conversations: 1:1 채팅방 (startup, enabler 쌍 + booking 연결 옵션)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enabler_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (startup_id, enabler_id)
);

-- messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 4000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_startup ON conversations(startup_id, last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_enabler ON conversations(enabler_id, last_message_at DESC NULLS LAST);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- conversations: 본인이 startup 또는 enabler인 것만 SELECT/INSERT
CREATE POLICY "conversations_select_participant" ON conversations FOR SELECT
  USING (auth.uid() = startup_id OR auth.uid() = enabler_id);

CREATE POLICY "conversations_insert_participant" ON conversations FOR INSERT
  WITH CHECK (auth.uid() = startup_id OR auth.uid() = enabler_id);

CREATE POLICY "conversations_update_participant" ON conversations FOR UPDATE
  USING (auth.uid() = startup_id OR auth.uid() = enabler_id);

-- messages: 자신이 속한 대화에서만 SELECT/INSERT
CREATE POLICY "messages_select_participant" ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (auth.uid() = c.startup_id OR auth.uid() = c.enabler_id)
  ));

CREATE POLICY "messages_insert_sender" ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (auth.uid() = c.startup_id OR auth.uid() = c.enabler_id)
    )
  );

-- 본인이 보낸 메시지만 update (read_at은 별도 정책)
CREATE POLICY "messages_update_sender" ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- read_at 업데이트는 받는 쪽이 가능: 자신이 받은 메시지(sender != me) read_at만
CREATE POLICY "messages_mark_read_recipient" ON messages FOR UPDATE
  USING (auth.uid() <> sender_id AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (auth.uid() = c.startup_id OR auth.uid() = c.enabler_id)
  ));

-- Realtime publication에 두 테이블 등록
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
