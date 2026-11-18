import styled from "styled-components";

export const E2ERoot = styled.div.attrs({ className: "e2e-container" })``;

export const E2EReadOnlyNotice = styled.p`
  padding: 12px 16px;
  margin: 20px auto;
  color: var(--warning-ink, #ffe2b5);
  background: rgba(245, 189, 104, 0.08);
  border: 1px solid rgba(245, 189, 104, 0.24);
  border-radius: 10px;
  font-size: 0.85rem;
  line-height: 1.5;
`;
