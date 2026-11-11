import styled from "styled-components";

export const Metrics = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 36px 0 0;

  @media (min-width: 560px) {
    gap: 12px;
  }

  @media (min-width: 760px) {
    max-width: 560px;
    margin: 42px auto 0;
  }

  @media (min-width: 1000px) {
    margin-inline: 0;
  }
`;
