import styled from "styled-components";

export const SecurityRoot = styled.div`
  min-width: 0;
`;

export const SecurityReadOnlyNotice = styled.p`
  padding: 12px 16px;
  margin: 20px auto;
  color: var(--warning-ink, #ffe2b5);
  background: rgba(245, 189, 104, 0.08);
  border: 1px solid rgba(245, 189, 104, 0.24);
  border-radius: 10px;
  font-size: 0.85rem;
  line-height: 1.5;
`;
