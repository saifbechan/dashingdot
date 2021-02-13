describe('index', () => {
  it('displays a phaser canvas', () => {
    cy.visit('/');
    cy.get('[data-testid="phaser"]').should('be.visible');
  });
});

export {};
