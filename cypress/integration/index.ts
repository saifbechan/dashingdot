import Agent = Cypress.Agent;
import Sinon from 'cypress/types/sinon';

let spy: Agent<Sinon.SinonSpy>;
Cypress.on('window:before:load', (win) => {
  spy = cy.spy(win.console, 'error');
});

describe('index', () => {
  it('displays a phaser canvas', () => {
    cy.visit('/');
    cy.get('[data-testid="phaser"]').should('be.visible');
  });

  it('does not log any errors', () => {
    cy.wait(100).then(() => {
      expect(spy).not.to.be.called;
    });

    cy.wrap({}).should(() => {
      expect(spy).not.to.be.called;
    });

    expect(spy).not.to.be.called;
  });
});

export {};
